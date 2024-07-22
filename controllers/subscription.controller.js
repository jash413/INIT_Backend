const Subscription = require('../models/subscription.model.js');
const moment = require('moment');
const response=require('../utils/response.js')
// nothing
exports.create = async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json(response.badRequest("Content cannot be empty!"));
    }
    if (!req.body.SUB_STDT) {
      return res
        .status(400)
        .json(
          response.badRequest("Subscription start date (SUB_STDT) is required.")
        );
    }

    const subscription = new Subscription({
      CUS_CODE: req.body.CUS_CODE,
      PLA_CODE: req.body.PLA_CODE,
      SUB_STDT: req.body.SUB_STDT, // Already in YYYY-MM-DD format
      LIC_USER: req.body.LIC_USER,
      SUB_ORDN: req.body.SUB_ORDN,
      status: req.body.status,
      ORD_REQD: req.body.ORD_REQD,
      ad_id: req.user.id,
      INV_DATE: req.body.INV_DATE, // Assuming this is also in YYYY-MM-DD format
    });

    const result = await Subscription.create(subscription);

    if (result.status === "error") {
      return res.status(result.statusCode).json(result);
    }

    res.status(result.statusCode).json(result);
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          err.message || "Some error occurred while creating the Subscription."
        )
      );
  }
};

const getTotalsubscriptionCount = async (
  search,
  filter_ad_id,
  filter_from,
  filter_to
) => {
  try {
    // Assuming subscription.getCount is a method that fetches the total count
    const [result] = await Subscription.getCount(
      search,
      filter_ad_id,
      filter_from,
      filter_to
    );
    return result.totalCount; // Adjust based on your actual result structure
  } catch (err) {
    console.error("Error getting total subscription count:", err);
    throw new Error("Unable to get total subscription count");
  }
};

// Retrieve all Subscriptions from the database
exports.findAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.items_per_page) || 0;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || "created_at";
    const order = req.query.order || "desc";
    const search = req.query.search || "";
    const filter_from = req.query.filter_from || null;
    const filter_to = req.query.filter_to || null;

    // Log query parameters
    console.log("Query parameters:", {
      page,
      limit,
      offset,
      sort,
      order,
      search,
      filter_from,
      filter_to,
    });

    // Validate date filters
    if (filter_from && !isValidDate(filter_from)) {
      return res
        .status(400)
        .json(response.error("Invalid filter_from date format"));
    }
    if (filter_to && !isValidDate(filter_to)) {
      return res
        .status(400)
        .json(response.error("Invalid filter_to date format"));
    }

    // If limit is not specified or set to 0, fetch all records without pagination
    let totalCount;
    if (limit === 0 || limit === null) {
      totalCount = await getTotalsubscriptionCount(search, filter_from, filter_to);
      limit = totalCount;
    }

    const subscriptions = await Subscription.getAll(
      limit,
      offset,
      sort,
      order,
      search,
      filter_from,
      filter_to
    );

    // If limit is not specified or set to fetch all records, set pagination data accordingly
    let paginationData = {};
    if (limit !== null) {
      totalCount = totalCount || subscriptions.length;
      const totalPages = Math.ceil(totalCount / (limit || 1));

      let links = [];
      const maxPageLinks = 5; // Limit the number of page links
      const startPage = Math.max(1, page - Math.floor(maxPageLinks / 2));
      const endPage = Math.min(totalPages, startPage + maxPageLinks - 1);

      for (let i = startPage; i <= endPage; i++) {
        links.push(
          createPageLink(
            i,
            page,
            limit,
            sort,
            order,
            search,
            filter_from,
            filter_to
          )
        );
      }

      if (page > 1) {
        links.unshift(
          createPageLink(
            page - 1,
            page,
            limit,
            sort,
            order,
            search,
            filter_from,
            filter_to,
            "Previous"
          )
        );
      }
      if (page < totalPages) {
        links.push(
          createPageLink(
            page + 1,
            page,
            limit,
            sort,
            order,
            search,
            filter_from,
            filter_to,
            "Next"
          )
        );
      }

      paginationData = {
        page: page,
        first_page_url: createUrl(
          1,
          limit,
          sort,
          order,
          search,
          filter_from,
          filter_to
        ),
        last_page: totalPages,
        next_page_url:
          page < totalPages
            ? createUrl(
                page + 1,
                limit,
                sort,
                order,
                search,
                filter_from,
                filter_to
              )
            : null,
        prev_page_url:
          page > 1
            ? createUrl(
                page - 1,
                limit,
                sort,
                order,
                search,
                filter_from,
                filter_to
              )
            : null,
        items_per_page: limit,
        from: offset + 1,
        to: offset + subscriptions.length,
        total: totalCount,
        links,
      };
    }

    res.json(
      response.success("Subscriptions retrieved successfully", subscriptions, {
        pagination: paginationData,
      })
    );
  } catch (err) {
    console.error("Error in findAll:", err);
    res
      .status(500)
      .json(
        response.error("An error occurred while retrieving subscriptions.")
      );
  }
};



// Helper function to validate date format
const createPageLink = (
  pageNum,
  currentPage,
  limit,
  sort,
  order,
  search,
  filter_ad_id,
  filter_created_from,
  filter_created_to,
  label = null
) => {
  return {
    url: createUrl(
      pageNum,
      limit,
      sort,
      order,
      search,
      filter_ad_id,
      filter_created_from,
      filter_created_to
    ),
    label: label || `${pageNum}`,
    active: pageNum === currentPage,
    page: pageNum,
  };
};

const createUrl = (
  page,
  limit,
  sort,
  order,
  search,
  filter_ad_id,
  filter_created_from,
  filter_created_to
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    items_per_page: limit.toString(),
    sort,
    order,
    search: encodeURIComponent(search),
  });

  if (filter_ad_id) params.append("filter_ad_id", filter_ad_id);
  if (filter_created_from)
    params.append("filter_created_from", filter_created_from);
  if (filter_created_to) params.append("filter_created_to", filter_created_to);

  return `/api/subscriptions?${params.toString()}`;
};

const isValidDate = (dateString) => {
  // This regex allows for dates in the format YYYY-MM-DD or YYYY-DD-MM
  const regex = /^\d{4}-(0[1-9]|1[0-2]|[1-3]\d)-(0[1-9]|[12]\d|3[01])$/;
  if (!regex.test(dateString)) return false;

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};




// Find a single Subscription with an id
exports.findOne = async (req, res) => {

  try {
    const data = await Subscription.findById(req.params.subId);
    console.log("Subscription retrieved successfully:", data);
    return res
      .status(200)
      .send(
        response.success("Subscription retrieved successfully", data)
      );
  } catch (err) {
    if (err.message === "Subscription not found") {
      console.error("Subscription not found with id:", req.params.subId);
      return res
        .status(404)
        .send(response.notFound("Subscription not found"));
    } else {
      console.error(
        "Error retrieving subscription with id",
        req.params.subId,
        ":",
        err
      );
      return res
        .status(500)
        .send(
          response.error(
            "Error retrieving subscription with id " + req.params.subId
          )
        );
    }
  }
};

// Update a Subscription identified by the id in the request
exports.update = async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    console.log("Empty request body");
    return res
      .status(400)
      .send(response.badRequest("Content can not be empty!"));
  }

  const subCode = req.params.subCode;

  try {
    const result = await Subscription.updateByCode(subCode, req.body);

    if (result.error) {
      return res
        .status(result.statusCode)
        .send(response.error(result.error, result.statusCode));
    }

    const updatedSubscription = result.data;
    return res
      .status(200)
      .send(
        response.success(
          "Subscription updated successfully",
          updatedSubscription
        )
      );
  } catch (err) {
    console.error("Error in updateByCode:", err);
    return res
      .status(500)
      .send(
        response.error(
          `Error updating Subscription with code ${subCode}: ${err.message}`
        )
      );
  }
};





// Delete a Subscription with the specified id in the request
exports.delete = async (req, res) => {
  try {
    const result = await Subscription.remove(
      req.params.subId,
      req.params.cusCode
    );
    if (result.success) {
      res.send({ message: "Subscription deleted successfully!" });
    } else {
      if (result.message === "Subscription not found") {
        res.status(404).send({ message: "Subscription not found" });
      } else {
        res.status(400).send({ message: result.message });
      }
    }
  } catch (err) {
    console.error("Error in delete controller:", err);
    res.status(500).send({
      message: `Could not delete subscription with id ${req.params.subId}`,
    });
  }
};


