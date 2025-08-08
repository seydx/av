import { HardwareDeviceContext } from '../src/lib/index.js';

// Check actual values on this system
console.log('Supported types:', HardwareDeviceContext.getSupportedTypes());

console.log('\nFinding types by name:');
console.log('videotoolbox:', HardwareDeviceContext.findTypeByName('videotoolbox'));
console.log('cuda:', HardwareDeviceContext.findTypeByName('cuda'));
console.log('unknown:', HardwareDeviceContext.findTypeByName('unknown'));

console.log('\nGetting type names:');
for (let i = -1; i <= 15; i++) {
  const name = HardwareDeviceContext.getTypeName(i);
  if (name) {
    console.log(`Type ${i}: ${name}`);
  }
}