const axios = require('axios');

/**
 * Health check module
 * Handles health check endpoint and related functionality
 */

/**
 * Health check endpoint handler
 * @param {Object} config - Configuration object containing backend URLs
 * @returns {Function} Express route handler
 */
function createHealthHandler(config) {
    return async (req, res) => {
        try {
            const response = await axios.get(`${config.user_manage_url}/health`, {
                timeout: 10000 // 10秒超时
            });
            res.json({
                status: 'ok',
                backend: 'connected',
                backend_response: response.data,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('健康检查失败:', error.message);
            res.json({
                status: 'ok',
                backend: 'disconnected',
                backend_error: error.message,
                fallback_mode: 'enabled',
                timestamp: new Date().toISOString()
            });
        }
    };
}

/**
 * Setup health routes
 * @param {Object} app - Express app instance
 * @param {Object} config - Configuration object
 */
function setupHealthRoutes(app, config) {
    // 健康检查
    app.get('/health', createHealthHandler(config));
}

module.exports = {
    createHealthHandler,
    setupHealthRoutes
};
