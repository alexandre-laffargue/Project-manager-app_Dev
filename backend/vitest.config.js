export default {
test: {
	// Increase hook timeout to avoid beforeAll hooks timing out when tests run in parallel
	hookTimeout: 60000,
    // run tests in the same thread/process to avoid flakiness from parallel DB instances
    threads: false,
    environment: 'node',
globals: true,
include: ["tests/**/*.test.js"],
coverage: {
enabled: false
}
}
}