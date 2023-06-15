import * as uuid from 'uuid'
import { TodosAccess } from '../dataLayer/todosAccess'
import { AttachmentUtils } from '../fileStorage/attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'

const logger = createLogger('busisnessLogic - Todos')
const attachmentUtils = new AttachmentUtils()
const todosAccess = new TodosAccess()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  return todosAccess.getTodosForUser(userId)
}

export const createTodo = async (
  newTodo: CreateTodoRequest,
  userId: string
): Promise<TodoItem> => {
  const todoId = uuid.v4()
  return todosAccess.createTodoItem(userId, todoId, newTodo)
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updatedTodo: UpdateTodoRequest
): Promise<Boolean> {
  await todosAccess.updateTodoItem(todoId, userId, updatedTodo)
  return true
}

export async function deleteTodo(userId: string, todoId: string) {
  await todosAccess.deleteTodoItem(todoId, userId)
  return true
}

export async function createAttachmentPresignedUrl(todoId: string) {
  const presignedUrl = attachmentUtils.getUploadUrl(todoId)
  logger.info('Generated presignedurl', presignedUrl)
  return presignedUrl
}
