import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { AttachmentUtils } from '../fileStorage/attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('dataLayer - TodosAccess')
const attachmentUtils = new AttachmentUtils()

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosIndex = process.env.INDEX_NAME
  ) {}

  async getTodosForUser(userId: string): Promise<TodoItem[]> {
    try {
      const result = await this.docClient
        .query({
          TableName: this.todosTable,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          },
          ScanIndexForward: false
        })
        .promise()
      logger.info('getTodosForUser done', { userId })
      return result.Items as TodoItem[]
    } catch (error) {
      logger.error('Failed to getTodosForUser: ', error)
    }
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Running getAllTodos')
    try {
      const result = await this.docClient
        .query({
          TableName: this.todosTable,
          IndexName: this.todosIndex,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        })
        .promise()
      logger.info('getAllTodos done', { userId })
      const items = result.Items
      return items as TodoItem[]
    } catch (error) {
      logger.error('Failed to getAllTodos: ', error)
    }
  }

  async createTodoItem(
    userId: string,
    todoId: string,
    newTodo: CreateTodoRequest
  ): Promise<TodoItem> {
    logger.info('Running createTodoItem')
    const createdAt = new Date().toISOString()
    const s3AttachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
    const newItem = {
      userId,
      todoId,
      createdAt,
      done: false,
      attachmentUrl: s3AttachmentUrl,
      ...newTodo
    }

    try {
      const result = await this.docClient
        .put({ TableName: this.todosTable, Item: newItem })
        .promise()
      logger.info('createTodoItem success: ', result)
    } catch (error) {
      logger.error('Failed to createTodoItem: ', error)
    }
    return newItem
  }

  async updateTodoItem(
    todoId: string,
    userId: string,
    updatedTodo: UpdateTodoRequest
  ): Promise<TodoUpdate> {
    logger.info('Running updateTodoItem')
    try {
      await this.docClient
        .update({
          TableName: this.todosTable,
          Key: {
            todoId,
            userId
          },
          AttributeUpdates: {
            name: {
              Action: 'PUT',
              Value: updatedTodo.name
            },
            dueDate: {
              Action: 'PUT',
              Value: updatedTodo.dueDate
            },
            done: {
              Action: 'PUT',
              Value: updatedTodo.dueDate
            }
          }
        })
        .promise()
      logger.info('updateTodoItem done', { userId, todoId })
    } catch (error) {
      logger.error('Failed to updateTodoItem: ', error)
    }
    return updatedTodo
  }

  async deleteTodoItem(todoId: string, userId: string): Promise<void> {
    logger.info('Running deleteTodoItem')
    try {
      await this.docClient
        .delete({
          TableName: this.todosTable,
          Key: {
            todoId,
            userId
          },
          ConditionExpression: 'todoId = :todoId',
          ExpressionAttributeValues: {
            ':todoId': todoId
          }
        })
        .promise()
      logger.info('deleteTodoItem done', { userId, todoId })
    } catch (error) {
      logger.error('Failed to deleteTodoItem: ', error)
    }
  }

  async updateTodoAttachmentUrl(
    todoId: string,
    userId: string,
    attachmentUrl: string
  ): Promise<void> {
    logger.info('Running updateTodoAttachmentUrl')
    try {
      await this.docClient
        .update({
          TableName: this.todosTable,
          Key: {
            todoId,
            userId
          },
          UpdateExpression: 'set attachmentUrl = :attachmentUrl',
          ExpressionAttributeValues: {
            ':attachmentUrl': attachmentUrl
          }
        })
        .promise()
      logger.info('updateTodoAttachmentUrl done', { userId, todoId })
    } catch (error) {
      logger.error('Failed to updateTodoAttachmentUrl: ', error)
    }
  }
}
