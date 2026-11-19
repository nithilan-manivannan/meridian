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
    lastTickAt: { type: Date, default: null }
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
      user = await User.create({ name, nameKey, totalSeconds: 0 });
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

// Add focus time (frontend sends 30s ticks while focusing).
app.post('/tick', async (req, res) => {
  try {
    const userId = String((req.body && req.body.userId) || '');
    let seconds = Number(req.body && req.body.seconds);
    if (!Number.isFinite(seconds)) seconds = 30;
    seconds = Math.max(1, Math.min(60, Math.round(seconds)));

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();
    // Simple guard: ignore ticks that arrive too soon to reduce double-counting.
    if (user.lastTickAt && now - user.lastTickAt < 20000) {
      return res.json({ userId: String(user._id), totalSeconds: user.totalSeconds || 0, ignored: true });
    }

    user.totalSeconds = (user.totalSeconds || 0) + seconds;
    user.lastTickAt = now;
    await user.save();

    res.json({ userId: String(user._id), totalSeconds: user.totalSeconds });
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
