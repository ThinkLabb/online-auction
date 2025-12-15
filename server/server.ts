import express, {Router} from "express";
import Config from "./config/config.ts";
import routes from "./routes/routes.ts"
import cookieParser from "cookie-parser";
import { startAuctionCloser } from "./jobs/close_auction.ts";


async function main() {
  const config: Config = new Config();

  const app = express();

  app.use(express.static('dist'));
	app.use(cookieParser());
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

  app.use(cookieParser())

  const router = Router();
  app.use(router);

  app.use("/api/", routes);
  
  startAuctionCloser();
  
  app.listen(config.PORT, ( )=> {
    console.log(`Server listening on port ${config.PORT}`);
  });
}

main();
