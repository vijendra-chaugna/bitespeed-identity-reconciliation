// src/controllers/identifyController.ts
import { Request, Response } from "express";
import { ContactService } from "../services/contactService";
import { IdentifyRequest } from "../types";

export class IdentifyController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  identify = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, phoneNumber } = req.body as IdentifyRequest;

      // Validate that at least one field is provided
      if (!email && !phoneNumber) {
        res.status(400).json({
          error: "Either email or phoneNumber must be provided"
        });
        return;
      }

      const result = await this.contactService.identify({ email, phoneNumber });
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in identify endpoint:", error);
      res.status(500).json({
        error: "Internal server error"
      });
    }
  };
}