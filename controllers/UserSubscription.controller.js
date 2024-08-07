const USRSubs = require("../models/UserSubscription.model.js");
const response = require("../utils/response.js");
const moment = require("moment");



exports.create = async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json(response.badRequest("Content cannot be empty!"));
    }

    const formatMomentDate = (date) =>
      date ? moment(date).format("YYYY-MM-DD HH:mm:ss") : null;

    const nextSubscriptionId = await USRSubs.getNextSubscriptionId();
    // console.log("new sub id", nextSubscriptionId);


  

    const usrSubs = new USRSubs({
      GST_CODE: req.body.GST_CODE,
      GST_NMBR: req.body.GST_NMBR,
      SYSTEM_ID: req.body.SYSTEM_ID,
      SUBSCRIPTION_ID: nextSubscriptionId,
      SUBSCRIPTION_DATE: formatMomentDate(req.body.SUBSCRIPTION_DATE),
      ALLOTED_CALLS: 0,
      USED_CALLS: 0,
      PENDING_CALLS: 0,
      is_active: req.body.is_active,
      created_by: req.user.name,
      created_on: formatMomentDate(req.body.created_on),
      user_id: req.body.user_id,
      expiry_date: formatMomentDate(req.body.expiry_date),
      INV_DATE: formatMomentDate(req.body.INV_DATE),
      INV_NO: req.body.INV_NO,
      IS_VERIFIED: req.body.IS_VERIFIED,
    });

    const data = await USRSubs.create(usrSubs);
  
    res
      .status(201)
      .json(response.success("User subscription created successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          err.message ||
            "Some error occurred while creating the user subscription."
        )
      );
  }
};

exports.findAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.items_per_page) || 0;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || "created_on";
    const order = req.query.order || "desc";
    const search = req.query.search || "";
    const filter_user_id = req.query.filter_user_id || null;
    const filter_from = req.query.filter_from || null;
    const filter_to = req.query.filter_to || null;

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

    const [usrSubs, totalCount] = await USRSubs.getAll(
      limit,
      offset,
      sort,
      order,
      search,
      filter_user_id,
      filter_from,
      filter_to
    );

    let paginationData = {};
    if (limit !== 0) {
      const totalPages = Math.ceil(totalCount / limit);

      let links = [];
      const maxPageLinks = 5;
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
            filter_user_id,
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
            filter_user_id,
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
            filter_user_id,
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
          filter_user_id,
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
                filter_user_id,
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
                filter_user_id,
                filter_from,
                filter_to
              )
            : null,
        items_per_page: limit,
        from: offset + 1,
        to: offset + usrSubs.length,
        total: totalCount,
        links,
      };
    }

    res.json(
      response.success("User subscriptions retrieved successfully", usrSubs, {
        pagination: paginationData,
      })
    );
  } catch (err) {
    console.error("Error in findAll:", err);
    res
      .status(500)
      .json(
        response.error("An error occurred while retrieving user subscriptions.")
      );
  }
};

const createPageLink = (
  pageNum,
  currentPage,
  limit,
  sort,
  order,
  search,
  filter_ad_id,
  filter_from,
  filter_to,
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
      filter_from,
      filter_to
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
  filter_from,
  filter_to
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    items_per_page: limit.toString(),
    sort,
    order,
    search: encodeURIComponent(search),
  });

  if (filter_ad_id) params.append("filter_ad_id", filter_ad_id);
  if (filter_from) params.append("filter_from", filter_from);
  if (filter_to) params.append("filter_to", filter_to);

  return `/api/subscriptions?${params.toString()}`;
};

const isValidDate = (dateString) => {
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

exports.findOne = async (req, res) => {
  try {
    const data = await USRSubs.findById(req.params.id);

    if (!data) {
      return res
        .status(404)
        .json(
          response.notFound(
            `User subscription not found with id ${req.params.id}`
          )
        );
    }

    res
      .status(200)
      .json(response.success("User subscription retrieved successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          `Error retrieving user subscription with id ${req.params.id}`
        )
      );
  }
};

exports.update = async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json(response.badRequest("Data to update can't be empty!"));
    }

    const data = await USRSubs.updateById(req.params.id, req.body);

    res
      .status(200)
      .json(response.success("User subscription updated successfully", data));
  } catch (err) {
    console.error("Error updating user subscription:", err.message, err.stack);
    res
      .status(500)
      .json(
        response.error(
          `Error updating user subscription with id ${req.params.id}`,
          err.message
        )
      );
  }
};


exports.delete = async (req, res) => {
  try {
    await USRSubs.remove(req.params.id);
    res.send({ message: "User subscription was deleted successfully!" });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete user subscription with id " + req.params.id,
    });
  }
};
