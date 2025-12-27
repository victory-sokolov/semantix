const config = {
    branches: ['main', 'next'],
    plugins: [
        '@semantic-release/commit-analyzer',
        [
            '@semantic-release/release-notes-generator',
            {
                preset: 'angular',
                releaseRules: [
                    { type: 'docs', scope: 'README', release: 'patch', emoji: '📝' },
                    { type: 'refactor', release: 'patch', emoji: '♻️' },
                    { type: 'style', release: 'patch', emoji: '🎨' },
                    { type: 'feat', release: 'minor', emoji: '✨' },
                    { type: 'fix', release: 'patch', emoji: '🐛' },
                    { type: 'ci', release: 'patch', emoji: '👷' },
                ],
            },
        ],
        [
            '@semantic-release/changelog',
            {
                changelogFile: 'CHANGELOG.md',
            },
        ],
        '@semantic-release/npm',
        '@semantic-release/git',
        '@semantic-release/github',
    ],
};

export default config;