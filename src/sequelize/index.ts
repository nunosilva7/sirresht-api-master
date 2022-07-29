import { Sequelize, Dialect, Op } from "sequelize";

import courseDefiner from "./models/course.model";
import discountDefiner from "./models/discount.model";
import dishDefiner from "./models/dish.model";
import menuDefiner from "./models/menu.model";
import menuDishDefiner from "./models/menuDish.model";
import participantDefiner from "./models/participant.model";
import participantDishDefiner from "./models/participantDish.model";
import reservationDefiner from "./models/reservation.model";
import reservationStatusDefiner from "./models/reservationStatus.model";
import roleDefiner from "./models/role.model";
import userDefiner from "./models/user.model";

import addAssociations from "./associations";
import seedDatabase from "./seeders";

// passing the database connection parameters
const sequelize = new Sequelize(process.env.DB_NAME!, process.env.DB_USER!, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql' as Dialect,
	pool: {
		max: 500,
		min: 0,
		idle: 10000,
	  }
	
	
});

// functions that define the models according to their files
const modelDefiners = [
	courseDefiner,
	discountDefiner,
	dishDefiner,
	menuDefiner,
	menuDishDefiner,
	participantDefiner,
	participantDishDefiner,
	reservationDefiner,
	reservationStatusDefiner,
	roleDefiner,
	userDefiner
];

// call all functions above
for (const modelDefiner of modelDefiners)
	modelDefiner(sequelize);

// define relationships between tables
addAssociations(sequelize);

(async () => {
	// sync sequelize's models with the database
	await sequelize.sync({ alter: true });

	// populate the database with necessary data
	seedDatabase(sequelize);
})();

export default sequelize;

export { Op };