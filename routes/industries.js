
const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const slugify = require('slugify');

router.get("/", async (req, res, next) => {
    try{
        const results = await db.query(`SELECT * FROM industries`);
        return res.json({ industries: results.rows });
    }
    catch(err){
        return next(err);
    }
});

router.get("/:code", async (req, res, next) => {
    try{
        const industry = req.params.code;
        const industryQuery = await db.query(
            `SELECT * 
                FROM industries
                WHERE code = '${industry}'`
        );

        if(industryQuery.rows.length === 0){
            let notFoundError = new Error(`There is no industry with code ${industry}`);
            notFoundError.status = 404;
            throw notFoundError;
        }

        const compIndyQuery = await db.query(
            `SELECT *
                FROM company_industries
                WHERE indy_name = $1`,
                [industry]
        );
        
        let companies = []
        for(let code of compIndyQuery.rows){
            const results2 = await db.query(
                `SELECT *
                    FROM companies
                    WHERE code = $1`,
                    [code.company]
            );
            companies.push(results2.rows[0]);
        }

        return res.json({ 
            industry: industryQuery.rows[0],
            "companies": companies
        });
    }
    catch(err){
        return next(err);
    }
});

router.post("/", async (req, res, next) => {
    try{
        const {code, industry} = req.body;
        const newCode = slugify(code, {lower: true, strict: true});
        const results = await db.query(
            `INSERT INTO industries (code, industry)
                VALUES ($1, $2)
                RETURNING *`,
                [newCode, industry]
        );
    
        return res.status(201).json({Industry: results.rows[0]});
    }
    catch(err){
        return next(err);
    }
});

router.put("/:code", async (req, res, next) => {
    try{
        const code = req.params.code;
        const industry = req.body.industry;
        const results = await db.query(
            `UPDATE industries
                SET industry = $1
                WHERE code = $2
                RETURNING code, industry`,
                [industry, code]
        );
        
        if(results.rows.length === 0){
            let notFoundError = new Error(`There is no industry with code ${code}`);
            notFoundError.status = 404;
            throw notFoundError;
        }

        return res.json({industries: results.rows[0]});
    }
    catch(err){
        return next(err);
    }
});

router.delete("/:code", async (req, res, next) => {
    try{
        const code = req.params.code;
        const results = await db.query(
            `DELETE FROM industries 
                WHERE code = $1
                RETURNING *`, 
                [code]
        );

        if(results.rows.length === 0){
            let notFoundError = new Error(`There is no industry with code ${code}`);
            notFoundError.status = 404;
            throw notFoundError;
        }

        return res.json({ status: "deleted" });
    }
    catch(err){
        return next(err);
    }
});

module.exports = router;
