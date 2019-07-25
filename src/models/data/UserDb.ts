import * as Sequelize from "sequelize";
import db from "../../service/db";
import ExistsResponse from "../data/ExistsResponse";
import ExistsResponseToken from "../data/ExistsResponseToken";
import { UserCreateRequest } from "../request/UserCreateRequest";

export class User extends Sequelize.Model {}

User.init(
    {
        username: Sequelize.STRING,
        password: Sequelize.STRING,
        email: Sequelize.STRING,
        role: Sequelize.STRING
    },
    {
        sequelize: db.get(),
        modelName: "user"
    }
);

// User.sync()
// .then(() => {
//     User.create({
//         username: 'user_aab',
//         password: 'abcdf',
//     });
// })
// .then((jane) => {
//     console.log(jane);
// });

// returns false and {}
// returns true and {userid : <id>}

export function exists(
    username: string,
    password: string
): Promise<ExistsResponse> {
    return User.findAndCountAll({
        where: {
            username,
            password
        }
    })
        .then(result => {
            console.log("result ", result);
            if (result.count === 0) {
                return new ExistsResponse(false, -1);
            } else {
                return new ExistsResponse(true, result.rows[0].get(
                    "id"
                ) as number);
            }
        })
        .catch(err => {
            console.log(err);
        });
    // .then((user) => user.id != undefined ? true : false;)
}

// export function getAll() {
//     return User.findAll({
//         order: [["createdAt", "DESC"]]
//     })
//         .map(el => el.get({ plain: true }))
//         .catch(err => {
//             return Promise.resolve({
//                 message: "Error creating Post",
//                 error: err
//             });
//         });
// }

export function getCompleteList() {
    return User.findAndCountAll({
        order: [["createdAt", "DESC"]]
    })
        .then(result => {
            return {
                users: result.rows,
                count: result.count
            };
        })
        .catch(err => {
            return Promise.resolve({
                message: "Error Fetching Post",
                error: err
            });
        });
}

export function getAll(page: number) {
    const pageSize = 10;
    return User.findAndCountAll({
        offset: page * pageSize - pageSize,
        limit: 10,
        order: [["createdAt", "DESC"]]
    })
        .then(result => {
            return {
                page: page,
                totalPages: Math.ceil(result.count / pageSize),
                count: result.count,
                users: result.rows
            };
        })
        .catch(err => {
            return Promise.resolve({
                message: "Error Fetching Post",
                error: err
            });
        });
}

export function getById(id: number) {
    return User.findOne({
        where: {
            id
        }
    })
        .then(user => {
            return user;
        })
        .catch(err => console.log(err));
}

export function create(param: UserCreateRequest): Promise<any> {
    return User.create(param.getAll())
        .then((user: User) => {
            return user.get();
        })
        .catch(err =>
            Promise.resolve({
                message: "Error creating User",
                error: err.toJSON()
            })
        );
}

export function update(id: number, param: UserCreateRequest): Promise<any> {
    return User.update(
        {
            username: param.username,
            password: param.password,
            email: param.email,
            role: param.role
        },
        {
            where: {
                id
            }
        }
    )
        .then(user => {
            console.log("updated");
            console.log(user);
        })
        .catch(err =>
            Promise.resolve({
                message: "Error Updating User",
                error: err.toJSON()
            })
        );
}

export function deleteUser(id: number): Promise<any> {
    return User.destroy({
        where: {
            id
        }
    })
        .then(user => {
            return user;
        })
        .catch(err =>
            Promise.resolve({
                message: "Error Deleting User",
                error: err.toJSON()
            })
        );
}

export function getUserRole(id: number): Promise<any> {
    return User.findOne({
        where: {
            id
        }
    })
        .then(user => {
            if (user) {
                return user.get("role");
            } else {
                console.log("user role not found");
            }
        })
        .catch(err => console.log(err));
}
