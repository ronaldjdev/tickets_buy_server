import { MeController } from "@/features/user/adapters/in/http/controllers/Me.controller.js";
import { UserController } from "@/features/user/adapters/in/http/controllers/User.controller.js";
import { UserRepository } from "@/features/user/adapters/out/persistence/repositories/User.repository.js";
import {
	CreateUser,
	DeleteUser,
	GetUser,
	ListUsers,
	UpdateUser,
} from "@/features/user/application/use-cases/index.js";

const userRepo = new UserRepository();

const createUser = new CreateUser(userRepo);
const getUser = new GetUser(userRepo);
const listUsers = new ListUsers(userRepo);
const updateUser = new UpdateUser(userRepo);
const deleteUser = new DeleteUser(userRepo);

export const userController = new UserController(
	createUser,
	getUser,
	listUsers,
	updateUser,
	deleteUser,
	userRepo,
);

export const meController = new MeController(userRepo, updateUser, createUser);
