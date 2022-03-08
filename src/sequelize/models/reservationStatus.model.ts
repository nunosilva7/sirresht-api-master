import { Sequelize, DataTypes, Model } from "sequelize";

export default (sequelize: Sequelize): void => {
    
    class ReservationStatus extends Model {};

    ReservationStatus.init({
        id: {
            type: DataTypes.TINYINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        desc: {
            type: DataTypes.ENUM("pending", "approved", "rejected", "canceled", "completed", "non-attendance"),
            allowNull: false
        }
    }, {
        modelName: "reservationStatus",
        tableName: "reservation_status",
        underscored: true,
        timestamps: false,
        sequelize
    });
}