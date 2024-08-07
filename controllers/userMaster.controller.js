const UsrMast = require("../models/userMaster.model");
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

    const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");

    // Ensure CREATED_BY is set
    const createdBy = req.user ? req.user.name : "Unknown"; // Adjust this based on your authentication setup

    if (!createdBy) {
      return res
        .status(400)
        .json(response.badRequest("Creator information is missing"));
    }

    const usrMast = new UsrMast({
      GST_CODE: req.body.GST_CODE,
      GST_NMBR: req.body.GST_NMBR,
      USR_ID: req.body.USR_ID,
      USR_PASS: req.body.USR_PASS,
      CLIENT_ID: req.body.CLIENT_ID,
      CLIENT_SECRET: req.body.CLIENT_SECRET,
      USR_ACTV: req.body.USR_ACTV,
      CREATED_ON: currentDate,
      CREATED_BY: createdBy,
      MODIFY_ON: formatMomentDate(req.body.MODIFY_ON),
      MODIFY_BY: req.body.MODIFY_BY,
      is_admin: req.body.is_admin,
      last_login: formatMomentDate(req.body.last_login),
      sandbox_access: 0,
    });
    console.log("user data", req.user);
    const data = await UsrMast.create(usrMast);

    res.status(201).json(response.success("User created successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          err.message || "Some error occurred while creating the user."
        )
      );
  }
};

exports.findAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.items_per_page) || 0;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || "CREATED_ON";
    const order = req.query.order || "desc";
    const search = req.query.search || "";
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

    const [users = [], totalCount = 0] = await UsrMast.getAll(
      limit,
      offset,
      sort,
      order,
      search,
      filter_from,
      filter_to
    );

    let paginationData = {};
    if (limit > 0) {
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
        to: offset + users.length,
        total: totalCount,
        links,
      };
    }

    res.json(
      response.success("Users retrieved successfully", users, {
        pagination: paginationData,
      })
    );
  } catch (error) {
    console.error("Error in findAll:", error);
    res
      .status(500)
      .json(response.error("Some error occurred while retrieving users"));
  }
};

const createPageLink = (
  pageNum,
  currentPage,
  limit,
  sort,
  order,
  search,
  filter_from,
  filter_to,
  label = null
) => {
  return {
    url: createUrl(pageNum, limit, sort, order, search, filter_from, filter_to),
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

  if (filter_from) params.append("filter_from", filter_from);
  if (filter_to) params.append("filter_to", filter_to);

  return `/api/userMaster?${params.toString()}`;
};

const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date.toISOString().startsWith(dateString);
};


exports.findOne = async (req, res) => {
  try {
    const data = await UsrMast.findById(req.params.id);

    if (!data) {
      return res
        .status(404)
        .json(response.notFound(`User not found with id ${req.params.id}`));
    }

    res.status(200).json(response.success("User retrieved successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(response.error(`Error retrieving user with id ${req.params.id}`));
  }
};

exports.update = async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json(response.badRequest("Data to update can't be empty!"));
    }

    const data = await UsrMast.updateById(req.params.id, req.body);

    if (!data) {
      return res
        .status(404)
        .json(
          response.notFound(
            `Cannot update user with id ${req.params.id}. Maybe user was not found!`
          )
        );
    }

    res.status(200).json(response.success("User updated successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(response.error(`Error updating user with id ${req.params.id}`));
  }
};

exports.delete = async (req, res) => {
  try {
    await UsrMast.remove(req.params.id);
    res.status(200).json(response.success("User was deleted successfully!"));
  } catch (err) {
    res
      .status(500)
      .json(response.error(`Could not delete user with id ${req.params.id}`));
  }
};
