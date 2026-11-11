import { Router, Request, Response } from "express";  //수정 +Request, Response
import { pool } from "../db/pool.js";

export const postRouter = Router();

//수정: 런타임 타입 건증 및 길이 제한 추가
//1. 글 목록 및 검색(10주차 실습 A- 입력 검증과 바인딩)
postRouter.get("/", async (req: Request, res: Response) => {
  const raw = req.query.q;

  // 런타임 타입 검증 (교안 24 - 문자열이 아닌 경우 400 반환)
  if (raw !== undefined && typeof raw !== "string") {
    return res.status(400).json({ message: "q must be a string" });
  }

  const q = raw ?? "";

  // 길이 검증 (교안 24- 50자 초과 시 400)
  if (q.length > 50) {
    return res.status(400).json({ message: "q is too long" });
  }

  // Prepared statement 적용 (교안 35)
  const [rows] = await pool.execute(
    `SELECT p.id, p.user_id, p.title, p.content, p.created_at, u.name AS authorName
     FROM posts p JOIN users u ON p.user_id = u.id
     WHERE p.title LIKE ?
     ORDER BY p.id DESC`,
    [`%${q}%`]
  );
  res.json(rows);
});

// 원본코드
// postRouter.get("/:id", async (req, res) => {
//   const [rows]: any = await pool.query(
//     `SELECT p.*, u.name AS authorName
//      FROM posts p JOIN users u ON p.user_id=u.id
//      WHERE p.id=${req.params.id}`
//   );
//   if (rows.length === 0) return res.status(404).json({message:"not found"});

//   const [attachments] = await pool.query(
//     `SELECT id, original_name, stored_name, size FROM attachments WHERE post_id=${req.params.id}`
//   );
//   res.json({...rows[0], attachments});
// });

postRouter.post("/", async (req, res) => {
  const user = req.session.user as any;
  const {title, content, userId} = req.body;

  const [result]: any = await pool.query(
    `INSERT INTO posts(user_id, title, content)
     VALUES (${userId ?? user?.id ?? 1}, '${title}', '${content}')`
  );
  res.json({message: "created", id: result.insertId});
});

postRouter.put("/:id", async (req, res) => {
  const {title, content} = req.body;
  await pool.query(
    `UPDATE posts SET title='${title}', content='${content}' WHERE id=${req.params.id}`
  );
  res.json({message: "updated"});
});

postRouter.delete("/:id", async (req, res) => {
  await pool.query(`DELETE FROM posts WHERE id=${req.params.id}`);
  res.json({message: "deleted"});
});
