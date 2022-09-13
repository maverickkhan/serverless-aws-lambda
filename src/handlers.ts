import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { OutputFileType } from "typescript";
import { v4 } from "uuid";

const docClient = new AWS.DynamoDB.DocumentClient();

class HttpError extends Error {
  constructor(public statusCode: number, body: Record<string, unknown>) {
    super(JSON.stringify(body));
  }
}

export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(event.body);
  const reqBody = JSON.parse(`${event.body}`);
  const Item = {
    ...reqBody,
    productId: v4(),
  };
  await docClient
    .put({
      TableName: "ProductsTable",
      Item,
    })
    .promise();
  return {
    statusCode: 201,
    body: Item,
  };
};

const fetchProductById = async (id: string | undefined) => {
  const product = await docClient
    .get({
      TableName: "Products",
      Key: {
        ProductId: id,
      },
    })
    .promise();

  if (!product.Item) {
    throw new HttpError(404, { error: "not found" });
  }
  return product.Item;
};

export const getProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  const item = await fetchProductById(id);
  // const product = await docClient
  //   .get({
  //     TableName: "Products",
  //     Key: {
  //       ProductId: id,
  //     },
  //   })
  //   .promise();

  // if (!product.Item) {
  //   return {
  //     statusCode: 404,
  //     body: JSON.stringify({ error: "not found" }),
  //   };
  // }
  return {
    statusCode: 200,
    body: item,
  };
};

export const updateProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  const reqBody = JSON.parse(event.body as string);
  const product = await docClient
    .get({
      TableName: "Products",
      Key: {
        ProductId: id,
      },
    })
    .promise();

  if (!product.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "not found" }),
    };
  }
  const Item = {
    ...reqBody,
    productId: id,
  };
  await docClient
    .put({
      TableName: "ProductsTable",
      Item,
    })
    .promise();
  return {
    statusCode: 200,
    body: Item,
  };
};
