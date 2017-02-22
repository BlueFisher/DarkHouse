import * as crypto from 'crypto';
import * as mongodb from 'mongodb';
import * as serverConfig from '../../config';

export interface user {
	_id?: string,
	email: string,
	passwordHash: string,
	records: any[]
}

function _getHashedPassword(password: string) {
	return crypto.createHash("md5").update(password).digest('hex');
}

function _connect(): Promise<mongodb.Db> {
	return mongodb.MongoClient.connect(serverConfig.mongoUrl);
}

export async function findUser(id: string): Promise<user | null> {
	let db = await _connect();
	let usersColl = db.collection('users');
	let res = await usersColl.findOne({
		_id: new mongodb.ObjectID(id)
	});
	await db.close();
	return res;
}

export async function signup(email: string, password: string): Promise<user | null> {
	let db = await _connect();
	let usersColl = db.collection('users');
	let user: user = await usersColl.findOne({
		email: email
	});
	if (user) {
		await db.close();
		return null;
	} else {
		user = {
			email: email,
			passwordHash: _getHashedPassword(password),
			records: []
		}
		let result = await usersColl.insertOne(user);
		user._id = result.insertedId.toHexString();
		await db.close();
		return user;
	}
}
export async function signin(email: string, password: string): Promise<user | null> {
	let db = await _connect();
	let usersColl = db.collection('users');
	let user = {
		email: email,
		passwordHash: _getHashedPassword(password)
	}
	let res = await usersColl.findOne(user);
	await db.close();
	return res;
}
// export async function addNewScore(userId: string, maxShipsCount: number) {
// 	let db = await _connect();
// 	let usersColl = db.collection('users');
// 	await usersColl.findOneAndUpdate({
// 		_id: new mongodb.ObjectID(userId)
// 	}, {
// 			$push: {
// 				scores: {
// 					shipsCount: maxShipsCount,
// 					datetime: new Date()
// 				}
// 			}
// 		}
// 	);
// 	await db.close();
// }