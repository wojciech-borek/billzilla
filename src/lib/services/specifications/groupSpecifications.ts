import type { SupabaseClient } from "../../../db/supabase.client";
import { CurrencyNotFoundError } from "../errors/groupErrors";

/**
 * Base Specification interface following the Specification Pattern
 */
export interface Specification<T> {
  isSatisfiedBy(candidate: T): Promise<boolean> | boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
}

/**
 * Abstract base class for group specifications
 */
export abstract class GroupSpecification<T = unknown> implements Specification<T> {
  abstract isSatisfiedBy(candidate: T): Promise<boolean> | boolean;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

/**
 * Composite specification for AND operations
 */
export class AndSpecification<T> extends GroupSpecification {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  async isSatisfiedBy(candidate: T): Promise<boolean> {
    const leftResult = await this.left.isSatisfiedBy(candidate);
    const rightResult = await this.right.isSatisfiedBy(candidate);
    return leftResult && rightResult;
  }
}

/**
 * Composite specification for OR operations
 */
export class OrSpecification<T> extends GroupSpecification {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  async isSatisfiedBy(candidate: T): Promise<boolean> {
    const leftResult = await this.left.isSatisfiedBy(candidate);
    const rightResult = await this.right.isSatisfiedBy(candidate);
    return leftResult || rightResult;
  }
}

/**
 * Composite specification for NOT operations
 */
export class NotSpecification<T> extends GroupSpecification {
  constructor(private specification: Specification<T>) {
    super();
  }

  async isSatisfiedBy(candidate: T): Promise<boolean> {
    const result = await this.specification.isSatisfiedBy(candidate);
    return !result;
  }
}

/**
 * Specification for validating that a user is an active member of a group
 */
export class UserIsActiveGroupMemberSpecification extends GroupSpecification {
  constructor(private supabase: SupabaseClient) {
    super();
  }

  async isSatisfiedBy({ groupId, userId }: { groupId: string; userId: string }): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("group_members")
      .select("status")
      .eq("group_id", groupId)
      .eq("profile_id", userId)
      .eq("status", "active")
      .single();

    return !error && data !== null;
  }
}

/**
 * Specification for validating that the current user is the creator of the group
 */
export class UserIsGroupCreatorSpecification extends GroupSpecification {
  constructor(private supabase: SupabaseClient) {
    super();
  }

  async isSatisfiedBy({ groupId, userId }: { groupId: string; userId: string }): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("profile_id", userId)
      .eq("status", "active")
      .eq("role", "creator")
      .single();

    return !error && data !== null;
  }
}

/**
 * Specification for validating that a currency exists in the system
 */
export class CurrencyExistsSpecification extends GroupSpecification {
  constructor(private supabase: SupabaseClient) {
    super();
  }

  async isSatisfiedBy(currencyCode: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("currencies").select("code").eq("code", currencyCode).single();

    if (error || !data) {
      throw new CurrencyNotFoundError(currencyCode);
    }

    return true;
  }
}

/**
 * Specification for validating that a currency is configured for a specific group
 */
export class CurrencyConfiguredForGroupSpecification extends GroupSpecification {
  constructor(private supabase: SupabaseClient) {
    super();
  }

  async isSatisfiedBy({ groupId, currencyCode }: { groupId: string; currencyCode: string }): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("group_currencies")
      .select("currency_code")
      .eq("group_id", groupId)
      .eq("currency_code", currencyCode)
      .single();

    return !error && data !== null;
  }
}

/**
 * Specification for validating group name requirements
 */
export class GroupNameValidSpecification extends GroupSpecification {
  isSatisfiedBy(name: string): boolean {
    return name !== null && name !== undefined && name.trim().length > 0;
  }
}

/**
 * Specification for validating group base currency code format
 */
export class GroupBaseCurrencyValidSpecification extends GroupSpecification {
  isSatisfiedBy(currencyCode: string): boolean {
    return currencyCode !== null && currencyCode !== undefined && currencyCode.trim().length > 0;
  }
}

/**
 * Specification for validating that a group exists and is active
 */
export class GroupExistsAndActiveSpecification extends GroupSpecification {
  constructor(private supabase: SupabaseClient) {
    super();
  }

  async isSatisfiedBy(groupId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("groups")
      .select("id, status")
      .eq("id", groupId)
      .eq("status", "active")
      .single();

    return !error && data !== null;
  }
}

/**
 * Composite specification for validating group creation command
 */
export class GroupCreationValidSpecification extends GroupSpecification {
  constructor(private supabase: SupabaseClient) {
    super();
  }

  async isSatisfiedBy(command: { name: string; base_currency_code: string }): Promise<boolean> {
    const nameValid = new GroupNameValidSpecification();
    const currencyCodeValid = new GroupBaseCurrencyValidSpecification();

    // Check basic validations first
    if (!nameValid.isSatisfiedBy(command.name) || !currencyCodeValid.isSatisfiedBy(command.base_currency_code)) {
      throw new Error("Invalid group creation parameters");
    }

    // Check if currency exists (this will throw CurrencyNotFoundError if not)
    const currencyExists = new CurrencyExistsSpecification(this.supabase);
    await currencyExists.isSatisfiedBy(command.base_currency_code);

    return true;
  }
}
