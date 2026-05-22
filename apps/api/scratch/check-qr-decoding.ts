import { verifyQRToken } from '../src/utils/qrcode';

const testTokens = [
  'ZWJlMGU0MmMtMDhjMC00OWMwLWJjOWUtNGNmM2UwMmZhYTllOjE3NzkyNzg4NTA3ODI6NWNiYzAzNGY4OWFkYWY2Y2IyYTE1YmYwZjZlMTY4OTE5MThjMGJmNDc0NmYzN2M5YTUyOTBmZWVjYzAwNzQ2ZA==',
  'MWJkOGRlNWYtNTViOC00NDQ1LTk5ZjItODMxNmI4ZTIzYmY3OjE3NzkyNzg4NTA3ODI6YzA5MzcwZGUwZmFmYmU5M2Y4OWW0OTkyN2E0NjkyNDYwODFkMWNlZTI5MWJmMGY0OWM1NGY1NjI1YzQzMjQ3MA==',
  'MDQ3ZDExMWMtYzlkNC00NDBiLThlYjEtMDRmMzM2OWFmMjVlOjE3NzkyNzg4NTA3ODI6Yjk4ZmYyZDIzZDM1NTcwYTkyYTBhZmU5YTBmZjY0MmE1ZTllMGEwN2Q4Y2VlMzJlZTQ5MmU1ZDY0ZGZjZDQyNw==',
  'NjE5N2RhMGQtMTdlNS00MGMwLTg0NzctZDU3ZDVkM2VkMjdmOjE3NzkyNzg3NTQwOTY6YmE5YjUwOGQ5YTBhMzFmM2I0MmFhOGRmMjc4OGQ4NGFmYmQ5NGU1M2QyMjhkN2M2N2VjMWM5M2RjOGIwYjcwNA=='
];

console.log('Testing verifyQRToken with the fixed backward-compatibility function:');
testTokens.forEach((token, index) => {
  const decoded = verifyQRToken(token);
  console.log(`Token #${index + 1}:`, decoded ? 'VALID ✅' : 'INVALID ❌', decoded);
});
