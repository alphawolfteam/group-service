import { Request, Response } from 'express';
import * as Joi from 'joi';

import config from '../../config';
import Endpoint, { HttpRequestType, getRequesterIdFromRequest } from '../group.endpoint';
import { UserAlreadyExistsInGroup } from '../../utils/errors/client.error';
import GroupFunctions from '../group.sharedFunctions';
import { validateObjectID } from '../../utils/joi';
import User from './user.interface';
import { UserRole, requiredRole } from './user.role';
import GroupRepository from '../utils/group.repository';
import { Unexpected } from '../../utils/errors/server.error';

export default class AddUserToGroup extends Endpoint {

  constructor() {
    super(HttpRequestType.POST, '/:id/users');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      params: {
        id: Joi.string().custom(validateObjectID).required(),
      },
      body: {
        id: Joi.string().custom(validateObjectID).required(),
        role: Joi.number().min(0).max(2),
      },
      header: {
        [config.userHeader]: Joi.string().required(),
      },
    });
  }

  async handler(req: Request, res: Response): Promise<void> {
    const groupID: string = req.params['id'];
    const requesterID = getRequesterIdFromRequest(req);
    const userToAdd: string = req.body['id'];
    const userRole: UserRole = req.body['role'];

    const addedUser = await AddUserToGroup.logic(groupID, userToAdd, userRole, requesterID);
    res.sendStatus(201).json(addedUser);
  }

  /**
   * adds a user to a group.
   * The function throws an error in the following cases:
   * - The group does not exist.
   * - The user already is in the group.
   * - The requester user does not have permission to add the user.
   * @param groupID - the ID of the group.
   * @param userID - the ID of the user to add to the group.
   * @param userRole - the role of the user to add to the group.
   * @param requesterID - the ID of the user requesting the action.
   */
  static async logic(
    groupID: string,
    userID: string,
    userRole = UserRole.Member,
    requesterID: string): Promise<User> {

    await GroupFunctions.verifyUserCanPreformAction(
      groupID,
      requesterID,
      requiredRole.user.add(userRole),
      `add a user to the group ${groupID}.`,
    );

    if (GroupFunctions.isUserInGroup(groupID, userID)) {
      throw new UserAlreadyExistsInGroup(groupID, userID);
    }

    const res = await GroupRepository.addUser(groupID, userID, userRole);
    if (!res) {
      throw new Unexpected(`Unexpected error when adding user ${userID} to group ${groupID}`);
    }

    return { id: userID, role: userRole };
  }
}