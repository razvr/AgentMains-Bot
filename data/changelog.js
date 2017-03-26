module.exports = [
  {
    version: 'v2.1.0',
    changes: [
      {
        type: 'Feature: reply types',
        msg: 'I can now reply to you, say something, or send a private message',
      },
      {
        type: 'Improvement: Send error messages to Spy',
        msg: 'Spy is now notified of errors directly',
      }
    ],
  },
  {
    version: 'v2.0.1',
    changes: [
      {
        type: 'Bugfix: commands are now case-insensitive',
        msg: '!Region and !region are now the same command',
      },
    ],
  },
  {
    version: 'v2.0.0',
    changes: [
      {
        type: 'New command: !changelog',
        msg: 'See new features and changes since my last update',
      },
      {
        type: 'New command: !boop',
        msg: 'Boop!',
      },
      {
        type: 'New command: !info',
        msg: 'Get information about me.',
      },
      {
        type: 'Update',
        msg: 'Added regions for PS, XBox, and Asia',
      },
      {
        type: 'Update',
        msg: 'I play some games now. Recommend me some titles!',
      },
    ],
  },
];
