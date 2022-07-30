# TypeORM PII(Personally Identifiable Information) Compliance Service

- Cascading Personally Identifiable Information Disposal

[![Node.js CI](https://github.com/kibae/typeorm-pii-compliance/actions/workflows/node.js.yml/badge.svg)](https://github.com/kibae/typeorm-pii-compliance/actions/workflows/node.js.yml)
[![NPM Version](https://badge.fury.io/js/typeorm-pii-compliance.svg)](https://www.npmjs.com/package/typeorm-pii-compliance)
[![License](https://img.shields.io/github/license/kibae/typeorm-pii-compliance)](https://github.com/kibae/typeorm-pii-compliance/blob/main/LICENSE)

## Install

- NPM

```shell
$ npm install typeorm-pii-compliance --save
```

- Yarn

```shell
$ yarn add typeorm-pii-compliance
```

----

## API

### `PiiComplianceService` Class

- `Constructor(options?: PiiComplianceServiceOptions)`
    - `replaceChar`(optional) : Character to be replaced when masking
        - `'*' | '-' | string`
    - `beforeDisposal`(optional) : Callback function called before disposal
        - `(type: EntityType, entity: any) => Promise<void> | void`

### `@PiiId()` Decorator

- Options
    - `hierarchyLevel`(enum, required) : Sets the level of the information hierarchy to adjust processing priorities.
        - `PiiHierarchyLevel.TOP` : The top-level entity. Usually defined in User or Member entities. It will be
          processed last.
        - `PiiHierarchyLevel.HIGHER`, `PiiHierarchyLevel.HIGH`, `PiiHierarchyLevel.MIDDLE`, `PiiHierarchyLevel.LOW`
          , `PiiHierarchyLevel.LOWER`
        - `PiiHierarchyLevel.LEAF` : It is an entity at the lowest level, such as data in the history records. It is
          processed first.
    - `strategy`(enum, optional) : Disposal strategy
        - `PiiDisposalStrategy.MASKING`(default) : `@PiiColumn()` Mask the set column.
        - `PiiDisposalStrategy.DELETE` : Delete entity from data source.
    - `group`(string, optional) : Group
        - If there are multiple ID systems that recognize users, you can separate the processing contexts using the
          group.

### `@PiiColumn` Decorator

- Options
    - `maskingMethod`(required) : Masking method
        - `null` : Change the data to null. Check if the column type is nullable.
        - `zero` : Change the data to 0(Number)
        - `blank` : Change the data to ""(blank string)
        - `edge1` ~ `edge8` : Masks 1 to 8 characters back and forth.
        - `center1` ~ `center8` : Masks 1 to 8 characters from the center.
        - `email` : Masks up to 5 characters before and after centered at @.
        - `(<T>(value: T) => Promise<T> | T)` : Custom transform callback.

----

## Usage 1. PiiDisposalStrategy.DELETE

- To delete entities with PII, set the `@PiiId` decorator in the user ID column to be used for filtering.

```typescript
// Top level user entity
@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  @PiiId({ strategy: PiiDisposalStrategy.DELETE, hierarchyLevel: PiiHierarchyLevel.TOP })
  id!: number;

  // ... other columns
}

// Examples of tables includes PII that depend on users
@Entity()
export class OrderHistory extends BaseEntity {
  @PrimaryGeneratedColumn()
  seq!: number;

  @Index()
  @ManyToOne((type) => User, (parent) => parent.id)
  @PiiId({ strategy: PiiDisposalStrategy.DELETE, hierarchyLevel: PiiHierarchyLevel.LEAF })
  user!: User;

  // ... other columns
}

const service = new PiiComplianceService();
/*
 * If a user with User.id of 9999 withdrew, the deletion proceeds in the order of OrderHistory -> User entity when called as follows.
 */
await service.process(
  // User ID
  9999,
  // Callback
  async (type, entity) => {
    console.log(type, entity);
  }
);

```

## Usage 2. PiiDisposalStrategy.MASKING

- Use the `@PiiColumn` decorator to mask some PII instead of deleting the Entity.

```typescript
// Top level user entity
@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  @PiiId({ strategy: PiiDisposalStrategy.MASKING, hierarchyLevel: PiiHierarchyLevel.TOP })
  id!: number;

  @Column()
  @PiiColumn({ maskingMethod: 'edge2' })
  firstName!: string;

  @Column()
  @PiiColumn({ maskingMethod: 'edge2' })
  lastName!: string;

  @Column()
  @PiiColumn({ maskingMethod: 'email' })
  email!: string;

  // ... other columns
}

// Examples of tables includes PII that depend on users
@Entity()
export class OrderHistory extends BaseEntity {
  @PrimaryGeneratedColumn()
  seq!: number;

  @Index()
  @ManyToOne((type) => User, (parent) => parent.id)
  @PiiId({ strategy: PiiDisposalStrategy.DELETE, hierarchyLevel: PiiHierarchyLevel.LEAF })
  user!: User;

  // ... other columns
}

const service = new PiiComplianceService();
await service.process(
  // User ID
  9999,
  // Callback
  async (type, entity) => {
    console.log(type, entity);
  }
);
```

----

## Contributors

<a href="https://github.com/kibae/typeorm-pii-compliance/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kibae/typeorm-pii-compliance" />
</a>
