// src/services/contactService.ts
import { AppDataSource } from "../utils/database.ts";
import { ContactEntity } from "../models/contactModel";
import { IdentifyRequest, IdentifyResponse, LinkPrecedence } from "../types";

export class ContactService {
  private contactRepository = AppDataSource.getRepository(ContactEntity);

  async identify(request: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = request;

    // Find all contacts matching either email or phone number
    const matchingContacts = await this.findMatchingContacts(email, phoneNumber);

    // If no matching contacts, create a new primary contact
    if (matchingContacts.length === 0) {
      const newContact = await this.createPrimaryContact(email, phoneNumber);
      return this.formatResponse(newContact, [newContact]);
    }

    // Get all primary contacts from the matching contacts
    const primaryContacts = await this.getPrimaryContacts(matchingContacts);
    
    // Determine the primary contact (oldest one)
    const primaryContact = this.getOldestContact(primaryContacts);
    
    // If there are multiple primary contacts, consolidate them
    if (primaryContacts.length > 1) {
      await this.consolidatePrimaryContacts(primaryContact, primaryContacts);
    }

    // Get all contacts in this hierarchy
    const allContacts = await this.getAllContactsInHierarchy(primaryContact.id);
    
    // Check if we need to create a new secondary contact
    const needsNewSecondary = await this.checkNeedsNewSecondary(
      primaryContact.id,
      email,
      phoneNumber
    );

    if (needsNewSecondary) {
      const newSecondary = await this.createSecondaryContact(
        email,
        phoneNumber,
        primaryContact.id
      );
      allContacts.push(newSecondary);
    }

    return this.formatResponse(primaryContact, allContacts);
  }

  private async findMatchingContacts(email?: string, phoneNumber?: string): Promise<ContactEntity[]> {
    const whereConditions = [];
    
    if (email) {
      whereConditions.push({ email });
    }
    if (phoneNumber) {
      whereConditions.push({ phoneNumber });
    }

    if (whereConditions.length === 0) {
      return [];
    }

    return await this.contactRepository.find({
      where: whereConditions,
      order: { createdAt: "ASC" }
    });
  }

  private async getPrimaryContacts(contacts: ContactEntity[]): Promise<ContactEntity[]> {
    const primaryIds = new Set<number>();
    const result: ContactEntity[] = [];

    for (const contact of contacts) {
      if (contact.linkPrecedence === LinkPrecedence.PRIMARY) {
        if (!primaryIds.has(contact.id)) {
          primaryIds.add(contact.id);
          result.push(contact);
        }
      } else if (contact.linkedId) {
        const primary = await this.contactRepository.findOne({
          where: { id: contact.linkedId }
        });
        if (primary && !primaryIds.has(primary.id)) {
          primaryIds.add(primary.id);
          result.push(primary);
        }
      }
    }

    return result;
  }

  private getOldestContact(contacts: ContactEntity[]): ContactEntity {
    return contacts.reduce((oldest, current) => 
      current.createdAt < oldest.createdAt ? current : oldest
    );
  }

  private async consolidatePrimaryContacts(
    primaryContact: ContactEntity,
    allPrimaryContacts: ContactEntity[]
  ): Promise<void> {
    for (const contact of allPrimaryContacts) {
      if (contact.id !== primaryContact.id) {
        // Update this primary to secondary
        contact.linkPrecedence = LinkPrecedence.SECONDARY;
        contact.linkedId = primaryContact.id;
        contact.updatedAt = new Date();
        await this.contactRepository.save(contact);

        // Update all secondaries linked to this contact
        await this.contactRepository.update(
          { linkedId: contact.id },
          { linkedId: primaryContact.id, updatedAt: new Date() }
        );
      }
    }
  }

  private async getAllContactsInHierarchy(primaryId: number): Promise<ContactEntity[]> {
    return await this.contactRepository.find({
      where: [
        { id: primaryId },
        { linkedId: primaryId }
      ],
      order: { createdAt: "ASC" }
    });
  }

  private async checkNeedsNewSecondary(
    primaryId: number,
    email?: string,
    phoneNumber?: string
  ): Promise<boolean> {
    if (!email && !phoneNumber) return false;

    const existingContacts = await this.contactRepository.find({
      where: [
        { linkedId: primaryId },
        { id: primaryId }
      ]
    });

    const hasEmail = email ? existingContacts.some(c => c.email === email) : true;
    const hasPhone = phoneNumber ? existingContacts.some(c => c.phoneNumber === phoneNumber) : true;

    return !(hasEmail && hasPhone);
  }

  private async createPrimaryContact(email?: string, phoneNumber?: string): Promise<ContactEntity> {
    const newContact = this.contactRepository.create({
      email,
      phoneNumber,
      linkPrecedence: LinkPrecedence.PRIMARY
    });
    return await this.contactRepository.save(newContact);
  }

  private async createSecondaryContact(
    email?: string,
    phoneNumber?: string,
    linkedId?: number
  ): Promise<ContactEntity> {
    const newContact = this.contactRepository.create({
      email,
      phoneNumber,
      linkedId,
      linkPrecedence: LinkPrecedence.SECONDARY
    });
    return await this.contactRepository.save(newContact);
  }

  private formatResponse(
    primaryContact: ContactEntity,
    allContacts: ContactEntity[]
  ): IdentifyResponse {
    const emails = [...new Set(allContacts.map(c => c.email).filter(Boolean))] as string[];
    const phoneNumbers = [...new Set(allContacts.map(c => c.phoneNumber).filter(Boolean))] as string[];
    const secondaryContactIds = allContacts
      .filter(c => c.id !== primaryContact.id)
      .map(c => c.id);

    return {
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    };
  }
}