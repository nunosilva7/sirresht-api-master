import { Sequelize } from "sequelize";

export default async (sequelize: Sequelize): Promise<void> => {
    const { course, discount, reservationStatus, role } = sequelize.models;

    await Promise.all([
        course.bulkCreate([
            { name: "starter" },
            { name: "main" },
            { name: "dessert" }
        ]),
        discount.bulkCreate([
            { desc: "Child under 12", percentage: 0.20 },
            { desc: "IPP community", percentage: 0.20 }
        ]),
        reservationStatus.bulkCreate([
            { desc: "pending" },
            { desc: "approved" },
            { desc: "rejected" },
            { desc: "canceled" },
            { desc: "completed" },
            { desc: "non-attendance" }
        ]),
        role.bulkCreate([
            { desc: "user" },
            { desc: "admin" }
        ])
    ]);
}