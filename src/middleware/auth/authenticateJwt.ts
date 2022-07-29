import { Request, Response, NextFunction } from "express";
import { header, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

export interface JwtPayload {
    userId: number,
    role: string,
}

export interface RequestWithAuthentication extends Request {
    userId: JwtPayload["userId"];
    role: JwtPayload["role"];
}

const authenticateJwt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await header("authorization", "Invalid or missing Token").exists().escape()
        .customSanitizer(value => value.replace("Bearer ", "")).isJWT().run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(401).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    const authorizationHeader = req.headers.authorization!;
    const token = authorizationHeader.replace("Bearer ", "");

    try {
        const decodedPayload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET! || "coiso") as JwtPayload;
        (req as RequestWithAuthentication).userId = +decodedPayload.userId;
        (req as RequestWithAuthentication).role = decodedPayload.role;
        next();
    }
    catch (err) {
        next({ status: 403, err: err });
    }
}

export default authenticateJwt;