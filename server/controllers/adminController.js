const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");
const db = require("../db");

const sendDocx = (res, document, filename) => {
  Packer.toBuffer(document)
    .then((buffer) => {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.send(buffer);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Error generating DOCX report." });
    });
};

const createReportTitle = (text) =>
  new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } });

const createReportSubtitle = (text) =>
  new Paragraph({ text, spacing: { after: 200 } });

const createDocxUserReport = (users, rangeText) => {
  const children = [createReportTitle("Campus Marketplace User Report")];
  if (rangeText) {
    children.push(createReportSubtitle(rangeText));
  }

  users.forEach((user) => {
    children.push(new Paragraph({ text: `ID: ${user.id}`, spacing: { before: 200 } }));
    children.push(new Paragraph({ text: `Name: ${user.name} ${user.surname}` }));
    children.push(new Paragraph({ text: `Email: ${user.email}` }));
    children.push(new Paragraph({ text: `Joined: ${new Date(user.created_at).toLocaleString()}` }));
    children.push(new Paragraph({ text: `Listings created: ${user.listings.length}` }));

    if (user.listings.length) {
      children.push(new Paragraph({ text: "Listings:", spacing: { before: 100 } }));
      user.listings.forEach((listing) => {
        children.push(
          new Paragraph({
            text: `• ${listing.title} — R${listing.price} — ${listing.location} — ${new Date(listing.created_at).toLocaleDateString()}`,
            spacing: { before: 50 },
          })
        );
      });
    } else {
      children.push(new Paragraph({ text: "No listings created.", spacing: { before: 100 } }));
    }
  });

  return new Document({ sections: [{ children }] });
};

const createDocxListingsReport = (listings, rangeText) => {
  const children = [createReportTitle("Campus Marketplace Listing Report")];
  if (rangeText) {
    children.push(createReportSubtitle(rangeText));
  }

  listings.forEach((listing) => {
    children.push(new Paragraph({ text: `ID: ${listing.id}`, spacing: { before: 200 } }));
    children.push(new Paragraph({ text: `Title: ${listing.title}` }));
    children.push(new Paragraph({ text: `Price: R${listing.price}` }));
    children.push(new Paragraph({ text: `Location: ${listing.location}` }));
    children.push(new Paragraph({ text: `Owner: ${listing.user_name || "Unknown"} ${listing.user_surname || ""}` }));
    children.push(new Paragraph({ text: `Owner email: ${listing.user_email || "Unknown"}` }));
    children.push(new Paragraph({ text: `Created: ${new Date(listing.created_at).toLocaleString()}` }));
    if (listing.description) {
      children.push(new Paragraph({ text: `Description: ${listing.description}` }));
    }
  });

  return new Document({ sections: [{ children }] });
};

const createDocxMessagesReport = (messages, rangeText) => {
  const children = [createReportTitle("Campus Marketplace Message Report")];
  if (rangeText) {
    children.push(createReportSubtitle(rangeText));
  }

  messages.forEach((message) => {
    children.push(new Paragraph({ text: `ID: ${message.id}`, spacing: { before: 200 } }));
    children.push(new Paragraph({ text: `From: ${message.sender_name || "Unknown"} ${message.sender_surname || ""}` }));
    children.push(new Paragraph({ text: `To: ${message.receiver_name || "Unknown"} ${message.receiver_surname || ""}` }));
    children.push(new Paragraph({ text: `Item: ${message.item_title || "None"}` }));
    children.push(new Paragraph({ text: `Sent: ${new Date(message.created_at).toLocaleString()}` }));
    children.push(new Paragraph({ text: `Message: ${message.message}` }));
  });

  return new Document({ sections: [{ children }] });
};

const verifyAdmin = (userId, res, callback) => {
  if (!userId) {
    return res.status(400).json({ error: "Missing user_id." });
  }

  db.query("SELECT is_admin FROM users WHERE id = ?", [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error while verifying admin access." });
    }

    if (!result.length || result[0].is_admin !== 1) {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    callback();
  });
};

exports.getUsers = (req, res) => {
  const userId = req.query.user_id;
  const { start_date, end_date } = req.query;

  verifyAdmin(userId, res, () => {
    const hasDateFilter = Boolean(start_date || end_date);
    let query = `SELECT u.id, u.name, u.surname, u.email, u.created_at, COUNT(l.id) AS listing_count
      FROM users u
      ${hasDateFilter ? "INNER JOIN" : "LEFT JOIN"} listings l ON u.id = l.user_id`;
    const params = [];
    const conditions = [];

    if (start_date) {
      conditions.push("l.created_at >= ?");
      params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
      conditions.push("l.created_at <= ?");
      params.push(`${end_date} 23:59:59`);
    }
    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " GROUP BY u.id, u.name, u.surname, u.email, u.created_at ORDER BY u.created_at DESC";

    db.query(query, params, (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while fetching users." });
      }

      res.json(rows);
    });
  });
};

exports.getListings = (req, res) => {
  const userId = req.query.user_id;
  const { start_date, end_date } = req.query;

  verifyAdmin(userId, res, () => {
    let query = `SELECT l.id, l.title, l.description, l.price, l.location, l.created_at, u.id AS user_id, u.name, u.surname, u.email
      FROM listings l
      LEFT JOIN users u ON l.user_id = u.id`;
    const params = [];
    const conditions = [];

    if (start_date) {
      conditions.push("l.created_at >= ?");
      params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
      conditions.push("l.created_at <= ?");
      params.push(`${end_date} 23:59:59`);
    }
    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY l.created_at DESC";

    db.query(query, params, (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while fetching listings." });
      }

      res.json(rows);
    });
  });
};

exports.getMessages = (req, res) => {
  const userId = req.query.user_id;
  const { start_date, end_date } = req.query;

  verifyAdmin(userId, res, () => {
    let query = `SELECT m.id, m.sender_id, sender.name AS sender_name, sender.surname AS sender_surname,
      m.receiver_id, receiver.name AS receiver_name, receiver.surname AS receiver_surname,
      m.message, m.item_id, l.title AS item_title, m.created_at
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users receiver ON m.receiver_id = receiver.id
      LEFT JOIN listings l ON m.item_id = l.id`;
    const params = [];
    const conditions = [];

    if (start_date) {
      conditions.push("m.created_at >= ?");
      params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
      conditions.push("m.created_at <= ?");
      params.push(`${end_date} 23:59:59`);
    }
    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY m.created_at DESC";

    db.query(query, params, (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while fetching messages." });
      }

      res.json(rows);
    });
  });
};

exports.downloadListingsReport = (req, res) => {
  const userId = req.query.user_id;
  const { start_date, end_date, format = "pdf" } = req.query;
  const requestedFormat = String(format || "pdf").trim().toLowerCase();

  if (requestedFormat !== "pdf" && requestedFormat !== "docx") {
    return res.status(400).json({ error: "Invalid format. Only pdf and docx are supported." });
  }

  verifyAdmin(userId, res, () => {
    let query = `SELECT l.id, l.title, l.description, l.price, l.location, l.created_at,
      u.id AS user_id, u.name AS user_name, u.surname AS user_surname, u.email AS user_email
      FROM listings l
      LEFT JOIN users u ON l.user_id = u.id`;
    const params = [];
    const conditions = [];

    if (start_date) {
      conditions.push("l.created_at >= ?");
      params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
      conditions.push("l.created_at <= ?");
      params.push(`${end_date} 23:59:59`);
    }
    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY l.created_at DESC";

    db.query(query, params, (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while fetching listings." });
      }

      const rangeText = start_date || end_date ? `Date filter: ${start_date || "Any"} to ${end_date || "Any"}` : "";
      if (requestedFormat === "docx") {
        const docxReport = createDocxListingsReport(rows, rangeText);
        return sendDocx(res, docxReport, "listings-report.docx");
      }

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=listings-report.pdf");
      doc.pipe(res);

      doc.fontSize(20).text("Campus Marketplace Listing Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      if (start_date || end_date) {
        doc.moveDown(0.5);
        const rangeText = `Date filter: ${start_date || "Any"} to ${end_date || "Any"}`;
        doc.fontSize(10).text(rangeText, { align: "center" });
      }
      doc.moveDown(2);

      rows.forEach((listing, index) => {
        doc.fontSize(12).fillColor("black").text(`ID: ${listing.id}`);
        doc.text(`Title: ${listing.title}`);
        doc.text(`Price: R${listing.price}`);
        doc.text(`Location: ${listing.location}`);
        doc.text(`Owner: ${listing.user_name || "Unknown"} ${listing.user_surname || ""}`);
        doc.text(`Owner email: ${listing.user_email || "Unknown"}`);
        doc.text(`Created: ${new Date(listing.created_at).toLocaleString()}`);

        if (listing.description) {
          doc.moveDown(0.2);
          doc.fontSize(10).fillColor("gray").text(`Description: ${listing.description}`);
          doc.fillColor("black");
        }

        if (index < rows.length - 1) {
          doc.moveDown();
          doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown();
        }
      });

      doc.end();
    });
  });
};

exports.downloadMessagesReport = (req, res) => {
  const userId = req.query.user_id;
  const { start_date, end_date, format = "pdf" } = req.query;
  const requestedFormat = String(format || "pdf").trim().toLowerCase();

  if (requestedFormat !== "pdf" && requestedFormat !== "docx") {
    return res.status(400).json({ error: "Invalid format. Only pdf and docx are supported." });
  }

  verifyAdmin(userId, res, () => {
    let query = `SELECT m.id, m.sender_id, sender.name AS sender_name, sender.surname AS sender_surname,
      m.receiver_id, receiver.name AS receiver_name, receiver.surname AS receiver_surname,
      m.message, m.item_id, l.title AS item_title, m.created_at
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users receiver ON m.receiver_id = receiver.id
      LEFT JOIN listings l ON m.item_id = l.id`;
    const params = [];
    const conditions = [];

    if (start_date) {
      conditions.push("m.created_at >= ?");
      params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
      conditions.push("m.created_at <= ?");
      params.push(`${end_date} 23:59:59`);
    }
    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY m.created_at DESC";

    db.query(query, params, (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while fetching messages." });
      }

      const rangeText = start_date || end_date ? `Date filter: ${start_date || "Any"} to ${end_date || "Any"}` : "";
      if (requestedFormat === "docx") {
        const docxReport = createDocxMessagesReport(rows, rangeText);
        return sendDocx(res, docxReport, "messages-report.docx");
      }

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=messages-report.pdf");
      doc.pipe(res);

      doc.fontSize(20).text("Campus Marketplace Message Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      if (start_date || end_date) {
        doc.moveDown(0.5);
        const rangeText = `Date filter: ${start_date || "Any"} to ${end_date || "Any"}`;
        doc.fontSize(10).text(rangeText, { align: "center" });
      }
      doc.moveDown(2);

      rows.forEach((message, index) => {
        doc.fontSize(12).fillColor("black").text(`ID: ${message.id}`);
        doc.text(`From: ${message.sender_name || "Unknown"} ${message.sender_surname || ""}`);
        doc.text(`To: ${message.receiver_name || "Unknown"} ${message.receiver_surname || ""}`);
        doc.text(`Item: ${message.item_title || "None"}`);
        doc.text(`Sent: ${new Date(message.created_at).toLocaleString()}`);
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor("gray").text(`Message: ${message.message}`);
        doc.fillColor("black");

        if (index < rows.length - 1) {
          doc.moveDown();
          doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown();
        }
      });

      doc.end();
    });
  });
};

exports.downloadUsersReport = (req, res) => {
  const userId = req.query.user_id;
  const { start_date, end_date, format = "pdf" } = req.query;
  const requestedFormat = String(format || "pdf").trim().toLowerCase();

  if (requestedFormat !== "pdf" && requestedFormat !== "docx") {
    return res.status(400).json({ error: "Invalid format. Only pdf and docx are supported." });
  }

  verifyAdmin(userId, res, () => {
    const hasDateFilter = Boolean(start_date || end_date);
    let query = `SELECT u.id, u.name, u.surname, u.email, u.created_at AS user_created_at,
      l.id AS listing_id, l.title AS listing_title, l.price AS listing_price,
      l.location AS listing_location, l.created_at AS listing_created_at
      FROM users u
      ${hasDateFilter ? "INNER JOIN" : "LEFT JOIN"} listings l ON u.id = l.user_id`;
    const params = [];
    const conditions = [];

    if (start_date) {
      conditions.push("l.created_at >= ?");
      params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
      conditions.push("l.created_at <= ?");
      params.push(`${end_date} 23:59:59`);
    }
    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY u.created_at DESC, l.created_at DESC";

    db.query(query, params, (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while fetching users." });
      }

      const rangeText = start_date || end_date ? `Date filter: ${start_date || "Any"} to ${end_date || "Any"}` : "";
      const users = [];
      const userMap = {};

      rows.forEach((row) => {
        if (!userMap[row.id]) {
          userMap[row.id] = {
            id: row.id,
            name: row.name,
            surname: row.surname,
            email: row.email,
            created_at: row.user_created_at,
            listings: []
          };
          users.push(userMap[row.id]);
        }

        if (row.listing_id) {
          userMap[row.id].listings.push({
            id: row.listing_id,
            title: row.listing_title,
            price: row.listing_price,
            location: row.listing_location,
            created_at: row.listing_created_at
          });
        }
      });

      if (requestedFormat === "docx") {
        const docxReport = createDocxUserReport(users, rangeText);
        return sendDocx(res, docxReport, "users-report.docx");
      }

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=users-report.pdf");
      doc.pipe(res);

      doc.fontSize(20).text("Campus Marketplace User Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      if (start_date || end_date) {
        doc.moveDown(0.5);
        const rangeText = `Date filter: ${start_date || "Any"} to ${end_date || "Any"}`;
        doc.fontSize(10).text(rangeText, { align: "center" });
      }
      doc.moveDown(2);

      users.forEach((user, index) => {
        doc.fontSize(12).fillColor("black").text(`ID: ${user.id}`);
        doc.text(`Name: ${user.name} ${user.surname}`);
        doc.text(`Email: ${user.email}`);
        doc.text(`Joined: ${new Date(user.created_at).toLocaleString()}`);
        doc.text(`Listings created: ${user.listings.length}`);

        if (user.listings.length) {
          doc.moveDown(0.5);
          doc.fontSize(11).text("Listings:");
          user.listings.forEach((listing) => {
            doc.fontSize(10).text(
              `  • ${listing.title} — R${listing.price} — ${listing.location} — ${new Date(listing.created_at).toLocaleDateString()}`
            );
          });
        } else {
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor("gray").text("  No listings created.");
          doc.fillColor("black");
        }

        if (index < users.length - 1) {
          doc.moveDown();
          doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown();
        }
      });

      doc.end();
    });
  });
};
