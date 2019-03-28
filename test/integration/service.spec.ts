import { MSC } from '../../src/lib';
import { BasicService } from './BasicService';

test('service', async () => {

  const host = new MSC()
    .host(new BasicService());

  console.log('res', await host.invoke('root', 'add', 1, 3));

});
