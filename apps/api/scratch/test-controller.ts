import { authController } from '../src/modules/auth/auth.controller';
import { Request, Response } from 'express';

async function run() {
  const req = {
    body: {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      fullName: 'Test User',
      phone: '+2348012345678',
      role: 'buyer'
    }
  } as Request;

  const res = {
    status: (code: number) => {
      console.log('STATUS:', code);
      return res;
    },
    json: (data: any) => {
      console.log('JSON:', data);
      return res;
    }
  } as Response;

  await authController.register(req, res);
}

run();
