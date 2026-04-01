import type { SearchRepositoriesInput } from "@/application/dto/SearchRepositoriesInput";
import type { Request, Response } from "express";

export class RepositoryController {
  search = async (
    request: Request<unknown, unknown, unknown, SearchRepositoriesInput>,
    response: Response,
  ): Promise<void> => {
    response.json({ message: "Hello, world!", query: request.query });
  };
}
