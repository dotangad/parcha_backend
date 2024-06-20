import { bodyParser, cors, express, morgan } from "../deps.ts";
import { authrouter } from "./auth.ts";
import { docrouter } from "./documents.ts";
import { registerExtension } from "./ext/engine.ts";
import notes from "../extensions/notes/index.ts";

// Register extensions
registerExtension(notes);

const app = express();

// Logger
app.use(morgan("dev"));

// CORS
app.use(cors());

// Body parser
app.use(bodyParser.json());

app.use("/v1/auth", authrouter);
app.use("/v1/documents", docrouter);

// Handle 404s
app.use((_: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
  });
});

export default app;
