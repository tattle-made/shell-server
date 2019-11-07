import { Express, Request, Response } from 'express';
import {plainToClass} from 'class-transformer';
import { CreateStoryRequestModel } from './CreateStoryRequestModel';
import { FactCheckedStoryController } from './FactCheckedStoryController';

// Job Queues
import { QueueManager } from '../../queue';
const queueManager = new QueueManager();

/**
 * todo : send success response, send failure response
 * @param app
 */
export function register(app: Express) {
    app.post('/api/fact-check-story', (req: Request, res: Response) => {
        const createStoryRequestModelInstance = plainToClass(CreateStoryRequestModel, req.body);
        const factCheckedStoryController = new FactCheckedStoryController();

        if (!createStoryRequestModelInstance.isValid()) {
            res.status(400).end();
        } else {
            queueManager.addFactCheckStoryIndexJob(createStoryRequestModelInstance)
            .then((result) => res.json({message: 'job added'}))
            .catch((err) => console.log(err));
        }

        // let successResponse: object;
        // let failureObject: object;

        // if (!createStoryRequestModelInstance.isValid()) {
        //     res.status(400).end();
        // } else {
        //     // create post in db
        //     factCheckedStoryController.create(createStoryRequestModelInstance)
        //     .then((factCheckedStory) => successResponse = factCheckedStory.get({plain: true}))
        //     .finally(() => {
        //         if (successResponse) {
        //             res.json(successResponse);
        //         } else {
        //             res.json(failureObject);
        //         }
        //     })
        //     .catch((err) => failureObject = {message: 'Something went wrong trying to save'});
        // }
    });
}
