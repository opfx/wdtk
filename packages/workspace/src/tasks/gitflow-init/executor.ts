import { TaskExecutor } from '@angular-devkit/schematics';
import { Observable } from 'rxjs';
export default function (opts): TaskExecutor<any> {
  return (options: any) => {
    return new Observable((obs) => {
      obs.next();
      obs.complete();
    });
  };
}
