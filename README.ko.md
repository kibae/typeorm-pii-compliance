# TypeORM PII(Personally Identifiable Information) Compliance Service
- 개인 식별 정보 자동 파기 서비스

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
  - `replaceChar`(optional) : Masking 시 대체될 문자
    - `'*' | '-' | string`
  - `beforeDisposal`(optional) : 파기되기 전에 호출되는 콜백 함수
    - `(type: EntityType, entity: any) => Promise<void> | void`

### `@PiiId()` Decorator
- Options
  - `hierarchyLevel`(enum, required) : 정보 계층의 레벨을 설정하여 처리 우선순위를 조정합니다.
    - `PiiHierarchyLevel.TOP` : 최상위 레벨의 entity. 보통 User, Member entity에 정의합니다. 가장 나중에 처리됩니다.
    - `PiiHierarchyLevel.HIGHER`, `PiiHierarchyLevel.HIGH`, `PiiHierarchyLevel.MIDDLE`, `PiiHierarchyLevel.LOW`, `PiiHierarchyLevel.LOWER`
    - `PiiHierarchyLevel.LEAF` : History 계열의 데이터 등 최말단 레벨의 entity입니다. 가장 먼저 처리됩니다.
  - `strategy`(enum, optional) : 처리 전략
    - `PiiDisposalStrategy.MASKING`(default) : `@PiiColumn()`가 설정된 컬럼을 마스킹 처리합니다.
    - `PiiDisposalStrategy.DELETE` : Entity를 삭제합니다.
  - `group`(string, optional) : 그룹
    - 사용자를 인식하는 ID체계가 복수일 경우, group 값을 이용해 처리 컨텍스트를 분리할 수 있습니다.

### `@PiiColumn` Decorator
- Options
  - `maskingMethod`(required) : 마스킹 방식
    - `null` : null로 데이터를 변경합니다. 컬럼 타입이 nullable 인지 확인하세요.
    - `zero` : 0 으로 변환
    - `blank` : "" 으로 변환
    - `edge1` ~ `edge8` : 앞뒤로 1~8글자를 마스킹합니다.
    - `center1` ~ `center8` : 가운데부터 1~8글자를 마스킹합니다.
    - `email` : @를 중심으로 앞뒤 최대 5글자를 마스킹합니다.
    - `(<T>(value: T) => Promise<T> | T)` : 변환 콜백으로 별도의 변환 수행

----

## Usage 1. PiiDisposalStrategy.DELETE
- 개인 식별 정보가 포함된 entity를 삭제하기 위해 필터링에 사용할 user ID 컬럼에 `@PiiId` decorator를 설정해 주세요.
```typescript
// 최상위 유저 테이블
@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  @PiiId({ strategy: PiiDisposalStrategy.DELETE, hierarchyLevel: PiiHierarchyLevel.TOP })
  id!: number;

  // ... other columns
}

// 유저에게 종속된 정보 테이블들 예시
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
 * User.id가 9999인 유저가 탈퇴한 경우 아래와 같이 호출하면 OrderHistory -> User entity 순서대로 삭제가 진행됩니다.
 */
await service.process(
  // User ID값
  9999,
  // 파기 처리되기 전에 호출되는 콜백
  async (type, entity) => {
    console.log(type, entity);
  }
);

```
## Usage 2. PiiDisposalStrategy.MASKING
- Entity 삭제 대신 일부 정보를 마스킹처리하려면 `@PiiColumn` decorator를 사용하세요.
```typescript
// 최상위 유저 테이블
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

// 유저에게 종속된 정보 테이블들 예시
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
 * User.id가 9999인 유저가 탈퇴한 경우 아래와 같이 호출하면 OrderHistory -> User entity 순서대로 마스킹과 삭제가 진행됩니다.
 */
await service.process(
        // User ID값
        9999,
        // 파기 처리되기 전에 호출되는 콜백
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
