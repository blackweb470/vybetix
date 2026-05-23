import { ticketsController } from '../src/modules/tickets/tickets.controller';

async function run() {
  const req: any = {
    user: {
      id: '591816c5-d1c8-4d98-be54-64b683834de0',
      email: 'akhatasebhudojoseph1@gmail.com',
      role: 'buyer'
    },
    headers: {
      'x-device-fingerprint': 'test-fingerprint-123'
    }
  };

  const res: any = {
    status: (code: number) => {
      console.log('Status:', code);
      return res;
    },
    json: (data: any) => {
      console.log('JSON:', JSON.stringify(data, null, 2));
    }
  };

  console.log('Invoking ticketsController.getMyTickets()...');
  await ticketsController.getMyTickets(req, res);
}

run();
