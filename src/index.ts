import * as express from 'express';
import * as cors from 'cors';
import * as Sentry from '@sentry/node';
import * as aws from 'aws-sdk';

// socket.io
import * as socketio from 'socket.io';
import { Request, Response } from 'express';
import { PostController } from './controllers/PostController';
import { SearchController } from './controllers/SearchController';
import { LoginController } from './controllers/LoginController';

import { PostCreateRequest } from './models/request/PostCreateRequest';

import { UserController } from './controllers/UserController';
import { UserCreateRequest } from './models/request/UserCreateRequest';

// validator
import { loginValidator } from './core/validation/login';

// middleware
import { authenticate } from './core/middleware/authenticate';
import { authorize } from './core/middleware/authorize';

const app = express();
const port = 3003;
const server = app.listen(port, () => {
    console.log('server is listening to ', port);
});
const io = socketio(server);
app.set('socketio', io);
io.on('connection', (client) => {
    console.log('Client is connected');
});

Sentry.init({
    dsn: 'https://015d3991941a475d9985ca5360098a1c@sentry.io/1499856',
});

app.use(
    cors({
        origin: '*',
    }),
);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
    );
    next();
});

app.use(Sentry.Handlers.requestHandler());
app.use(express.json());
app.use(authenticate);
app.use(authorize);

// import logger from './logger-core';
const postController = new PostController();
const searchController = new SearchController();
const loginController = new LoginController();
const userController = new UserController();

app.get('/', (req: Request, res: Response) => {
    res.send('pong');
});

app.get('/api/posts/:page', (req: Request, res: Response) => {
    const page = req.params.page || 1;
    postController.getAll(page).then((posts) => res.send(posts));
});

app.post('/api/postByTime/:page', (req: Request, res: Response) => {
    const page = req.params.page || 1;
    const { startDate, endDate } = req.body;
    const d1 = new Date(startDate).toISOString();
    const d2 = new Date(endDate).toISOString();
    postController
        .getByTime(page, d1, d2)
        .then((posts) => {
            res.send(posts);
        })
        .catch((err) => res.send(err.JSON));
});

app.post('/api/postByTimeAndUsers/:page', (req: Request, res: Response) => {
    const page = req.params.page || 1;
    const { users_id, startDate, endDate } = req.body;
    const d1 = new Date(startDate).toISOString();
    const d2 = new Date(endDate).toISOString();
    // users_id as Array<number>;
    postController
        .getByTimeAndUsers(users_id, page, d1, d2)
        .then((posts) => {
            res.send(posts);
        })
        .catch((err) => res.send(err.JSON));
});

app.post('/api/posts', (req: Request, res: Response) => {
    const post = new PostCreateRequest(req.body);
    const ioPost = req.app.get('socketio');
    postController
    .create(post)
    .then((response: JSON) => {
        ioPost.emit('posts/newData', { name: 'gully' });
        res.send(response);
    })
    .catch((err) => res.send(err.JSON));
});

app.get('/api/posts/id/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    postController.get(id).then((post) => res.send(post));
});

app.delete('/api/posts/delete/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    postController.delete(id).then((post) => res.send(post));
});

app.get('/api/search', (req: Request, res: Response) => {
    res.send(searchController.search(req.query));
});

app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    const { errors, isValid } = loginValidator(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }
    loginController
        .login(username, password)
        .then((response) => {
            res.send(response);
        })
        .catch((err) => console.log(err));
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
    const { token } = req.body;
    loginController.logout(token).then((response) => res.send(response));
});

app.get('/api/user/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    userController.getById(id).then((user) => {
        res.send(user);
    });
});

app.get('/api/users/:page', (req: Request, res: Response) => {
    const page = req.params.page || 1;
    userController.getAll(page).then((users) => {
        res.send(users);
    });
});

app.get('/api/userList', (req: Request, res: Response) => {
    userController.getCompleteList().then((users) => {
        res.send(users);
    });
});

app.post('/api/users/create', (req: Request, res: Response) => {
    const user = new UserCreateRequest(req.body);
    userController
        .create(user)
        .then((response) => res.send(response))
        .catch((err) => res.send(err.JSON));
});

app.post('/api/users/update/:id', (req: Request, res: Response) => {
    const user = new UserCreateRequest(req.body);
    const { id } = req.params;
    userController
        .update(id, user)
        .then((response) => res.send(response))
        .catch((err) => res.send(err.JSON));
});

app.delete('/api/users/delete/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    userController
        .delete(id)
        .then((response) => res.send(response))
        .catch((err) => res.send(err.JSON));
});

app.post('/api/index-pending', (req: Request, res: Response) => {
    postController.getIndexPendingPosts()
    .then((result) => {
        res.send(result);
    })
    .catch((err) => res.send(err.JSON));
});

app.use(Sentry.Handlers.errorHandler());

// app.use(function onError(err, req, res, next) {
//     // The error id is attached to `res.sentry` to be returned
//     // and optionally displayed to the user for support.
//     res.statusCode = 500;
//     res.end(res.sentry + '\n');
//   });
