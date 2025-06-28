   // debug-listener.js
   process.on('unhandledRejection', err => {
     console.error('unhandledRejection >>>', err);
   });
   process.on('uncaughtException', err => {
     console.error('uncaughtException >>>', err);
   });