// Simple test script to verify the knowledge base API
const axios = require('axios');
const FormData = require('form-data');

async function testKnowledgeBaseAPI() {
    console.log('🧪 Testing Knowledge Base API...\n');

    try {
        // Step 1: Test login first
        console.log('1. Testing login...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'test@example.com',
            password: 'testpassword'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Login response:', loginResponse.data);

        if (loginResponse.data.success) {
            const { token, user_id } = loginResponse.data;
            console.log('✅ Login successful');
            console.log('Token:', token.substring(0, 20) + '...');
            console.log('User ID:', user_id);

            // Step 2: Test knowledge base list API
            console.log('\n2. Testing knowledge base list API...');
            
            const formData = new FormData();
            formData.append('user_id', user_id);
            formData.append('token', token);

            const kbResponse = await axios.post('http://localhost:3001/user/knowledgebase/get_list', formData, {
                headers: formData.getHeaders()
            });

            console.log('Knowledge base response:', kbResponse.data);
            console.log('✅ Knowledge base API test successful');

        } else {
            console.log('❌ Login failed:', loginResponse.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testKnowledgeBaseAPI();
