const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameKey: { type: String, required: true, unique: true, index: true },
    totalSeconds: { type: Number, default: 0 },
    lastTickAt: { type: Date, default: null },
    recentTickIds: { type: [String], default: [] }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

function toUser(u) {
  return { userId: String(u._id), name: u.name, totalSeconds: u.totalSeconds || 0 };
}

// Claim/join by name. Reuses same normalized name so a user can resume on another device.
app.post('/join', async (req, res) => {
  try {
    const name = String((req.body && req.body.name) || '').trim();
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (name.length > 24) return res.status(400).json({ error: 'Name too long' });

    const nameKey = name.toLowerCase();
    let user = await User.findOne({ nameKey });
    if (!user) {
      return res.status(503).json({ error: 'Database temporarily unavailable. Please try again later.' });
    }
    res.json(toUser(user));
  } catch (e) {
    if (e && e.code === 11000) return res.status(409).json({ error: 'Name already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Leaderboard sorted by total focus seconds (desc).
app.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({}, { name: 1, totalSeconds: 1 })
      .sort({ totalSeconds: -1, createdAt: 1 })
      .limit(50)
      .lean();

    res.json(
      users.map((u) => ({
        userId: String(u._id),
        name: u.name,
        totalSeconds: u.totalSeconds || 0
      }))
    );
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Migrate a previously saved device total without ever lowering the database value.
// MongoDB applies $max atomically, so concurrent clients cannot overwrite a higher total.
app.post('/sync', async (req, res) => {
  try {
    const userId = String((req.body && req.body.userId) || '');
    const rawSeconds = Number(req.body && req.body.totalSeconds);
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    if (!Number.isSafeInteger(rawSeconds) || rawSeconds < 0 || rawSeconds > 2147483647) {
      return res.status(400).json({ error: 'Invalid totalSeconds' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $max: { totalSeconds: rawSeconds } },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(toUser(user));
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add focus time (frontend sends 30s ticks while focusing).
app.post('/tick', async (req, res) => {
  try {
    const userId = String((req.body && req.body.userId) || '');
    let seconds = Number(req.body && req.body.seconds);
    if (!Number.isFinite(seconds)) seconds = 30;
    seconds = Math.max(1, Math.min(60, Math.round(seconds)));
    const tickId = String((req.body && req.body.tickId) || '').slice(0, 100);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    if (req.body && req.body.tickId != null && !tickId) {
      return res.status(400).json({ error: 'Invalid tickId' });
    }

    const now = new Date();
    const tickCutoff = new Date(now.getTime() - 20000);
    const filter = {
      _id: userId,
      $or: [
        { lastTickAt: null },
        { lastTickAt: { $lte: tickCutoff } }
      ]
    };
    if (tickId) filter.recentTickIds = { $ne: tickId };
    const update = {
      $inc: { totalSeconds: seconds },
      $set: { lastTickAt: now }
    };
    if (tickId) update.$push = { recentTickIds: { $each: [tickId], $slice: -100 } };

    // Guard and increment atomically; request IDs make retries idempotent.
    const user = await User.findOneAndUpdate(filter, update, { new: true, runValidators: true });
    if (user) {
      return res.json({ userId: String(user._id), totalSeconds: user.totalSeconds || 0 });
    }

    const current = await User.findById(userId).lean();
    if (!current) return res.status(404).json({ error: 'User not found' });
    const duplicate = !!(tickId && (current.recentTickIds || []).includes(tickId));
    res.json({
      userId: String(current._id),
      totalSeconds: current.totalSeconds || 0,
      ignored: !duplicate,
      duplicate
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});
app.get('/', (req, res) => res.send('Meridian leaderboard API is running'));

const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => app.listen(port, () => console.log('Listening on port ' + port)))
  .catch((err) => {
    console.error('MongoDB connection failed', err);
    process.exit(1);
  });
