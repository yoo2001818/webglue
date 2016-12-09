import fs from 'fs';
import loadCollada from '../src/loader/collada';

loadCollada(fs.readFileSync('./geom/cat.dae', 'utf-8'));
