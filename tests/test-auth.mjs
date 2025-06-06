import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function testAuth() {
  console.log('🔐 Testing Authentication System\n');

  try {
    console.log('1. Testing User Registration...');
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const registerData = await registerResponse.json();
    console.log('✅ Registration:', registerData.message);
    console.log('Token received:', !!registerData.token);

    console.log('\n2. Testing User Login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('✅ Login:', loginData.message);
    const token = loginData.token;

    console.log('\n3. Testing Protected Route - Get User Info...');
    const meResponse = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const meData = await meResponse.json();
    console.log('✅ User Info:', meData.data.user.username);

    console.log('\n4. Testing Wallet Info...');
    const walletResponse = await fetch(`${BASE_URL}/wallet/info`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const walletData = await walletResponse.json();
    console.log(
      '✅ Wallet Address:',
      walletData.data.wallet.address.substring(0, 20) + '...'
    );
    console.log('Balance:', walletData.data.wallet.balance);

    console.log('\n5. Testing Transaction Creation...');
    const transactionResponse = await fetch(`${BASE_URL}/wallet/transact`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: 'dummy-recipient-address',
        amount: 50,
      }),
    });

    const transactionData = await transactionResponse.json();
    console.log('✅ Transaction:', transactionData.message);

    console.log('\n6. Testing Logout...');
    const logoutResponse = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
    });

    const logoutData = await logoutResponse.json();
    console.log('✅ Logout:', logoutData.message);

    console.log('\n🎉 All authentication tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();
