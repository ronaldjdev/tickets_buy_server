import { appLogger } from "../../platform/di/Logger.di.js";
import { MeController } from "./adapters/in/http/controllers/Me.controller.js";
import { UserController } from "./adapters/in/http/controllers/User.controller.js";
import { UserRepository } from "./adapters/out/persistence/repositories/User.repository.js";
import {
	CreateUser,
	DeleteUser,
	GetUser,
	ListUsers,
	UpdateUser,
} from "./application/use-cases/index.js";

const userRepo = new UserRepository();

const createUser = new CreateUser(userRepo, appLogger);
const getUser = new GetUser(userRepo);
const listUsers = new ListUsers(userRepo);
const updateUser = new UpdateUser(userRepo, appLogger);
const deleteUser = new DeleteUser(userRepo, appLogger);

export const userController = new UserController(
	createUser,
	getUser,
	listUsers,
	updateUser,
	deleteUser,
	userRepo,
);

export const meController = new MeController(userRepo, updateUser, createUser);
