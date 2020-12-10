import { Request, Response } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType } from './group.endpoint';
import { IGroup } from './utils/group.interface';
import { GroupNotFound } from '../utils/errors/client.error';
import GroupFunctions from './group.sharedFunctions';
import { validateObjectID } from '../utils/joi';

export default class GetGroupByID extends Endpoint {

  constructor() {
    super(HttpRequestType.GET, '/:id');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      params: {
        id: Joi.string().custom(validateObjectID).required(),
      },
    });
  }

  async handler(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const group: IGroup = await GetGroupByID.logic(id);
    res.json(group);
  }

  static async logic(id: string): Promise<IGroup>  {
    const group = await GroupFunctions.findGroupByID(id);
    if (!group) throw new GroupNotFound(id);
    return group;
  }

}