import { Sequelize } from "sequelize";

export default (sequelize: Sequelize): void => {
    const {
        course,
        discount,
        dish,
        menu,
        menuDish,
        participant,
        participantDish,
        reservation,
        reservationStatus,
        role,
        user
    } = sequelize.models;

    course.hasMany(dish, { foreignKey: { allowNull: false } });
    dish.belongsTo(course, { foreignKey: { allowNull: false } });

    menu.belongsToMany(dish, { through: menuDish });
    dish.belongsToMany(menu, { through: menuDish });

    reservationStatus.hasMany(reservation, { foreignKey: { allowNull: false, defaultValue: 1 } });
    reservation.belongsTo(reservationStatus, { foreignKey: { allowNull: false, defaultValue: 1 }, as: 'status' });

    reservation.hasMany(participant, { foreignKey: { allowNull: true }, as: 'participants' });
    participant.belongsTo(reservation, { foreignKey: { allowNull: true } });

    dish.belongsToMany(participant, { through: participantDish });
    participant.belongsToMany(dish, { through: participantDish });

    discount.hasMany(participant, { as: 'discount' });
    participant.belongsTo(discount);

    user.hasMany(participant);
    participant.belongsTo(user);

    role.hasMany(user, { foreignKey: { allowNull: false, defaultValue: 1 } });
    user.belongsTo(role, { foreignKey: { allowNull: false, defaultValue: 1 } });
}