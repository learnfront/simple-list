$(function() {
    const inputsSelectors = {};
    const INIT_PAGE = 1;
    const STATUS_VALID = 'valid';
    const STATUS_INVALID = 'invalid';
    const PEOPLE_URL = 'http://128.199.141.23/people';
    //not Armenian letters pattern
    const VALIDATION_PATTERN = /[^\u0561-\u0587\u0531-\u0556]+/g;
    const START_DATE = 1900;
    const DIFFERENCE_DATE = 18;
    let totalPages = 1;
    let currentPage = 1;
    let searchData = {};
    let searchContainer = $('.search-container');
    let tableBody = $('#table-data');
    let previousPage = $('.previous');
    let nextPage = $('.next');
    let searchInputs = $('form input');
    const searchFieldsArr = ['firstName', 'lastName', 'fatherName', 'year'];

    resetTable();
    initInputs(searchFieldsArr);

    $('#search').click((e) => {
        e.preventDefault();
        currentPage = INIT_PAGE;
        searchData = collectData();

        let error = validate(searchData);
        cleanErrors();

        if (error.status === STATUS_VALID) {
            showLoadMask();
            let peoplePromise = getPeoplePromise();

            peoplePromise.done((data) => {
                updateTable(data.people);
                updatePagination(data.totalPages);
                hideLoadMask();
            }).fail((error) => {
                hideLoadMask();
                console.log(error);
            });

            disableItem($('#search'));

        } else {
            showErrors(error);
            disableItem($('#search'));
        }
    });

    $('form input.form-control').keydown(() => {
        let data = collectData();
        let error = validate(data);
        cleanErrors();

        if (error.status === STATUS_INVALID) {
            showErrors(error);
            disableItem($('#search'));
        } else {
            enableItem($('#search'));
        }
    });

    $('.pagination').on('click', '.page-item', (e) => {
        e.preventDefault();

        if ($(this).hasClass('next')) {
            currentPage++;
        } else if ($(this).hasClass('previous')) {
            currentPage--;
        } else {
            currentPage = parseInt($(this).text());
        }

        searchData.page = currentPage;
        let peoplePromise = getPeoplePromise();

        peoplePromise.done((data) => {
            updateTable(data.people);
            updatePagination(data.totalPages);
            hideLoadMask();
        }).fail((error) => {
            hideLoadMask();
            console.log(error);
        })
    });

    function collectData() {
        let data = getInputsValues(searchFieldsArr);
        data.page = INIT_PAGE;

        return data;
    }

    function validate(data) {
        let error = {
            status: STATUS_VALID,
            fields: []
        };

        if (data.firstName === '' || data.firstName.match(VALIDATION_PATTERN)) {
            error.status = STATUS_INVALID;
            error.fields.push('firstName');
        }

        if (data.lastName === '' || data.lastName.match(VALIDATION_PATTERN)) {
            error.status = STATUS_INVALID;
            error.fields.push('lastName');
        }

        if (data.fatherName.match(VALIDATION_PATTERN)) {
            error.status = STATUS_INVALID;
            error.fields.push('fatherName');
        }

        if (data.year !== '' && !(data.year > START_DATE && data.year < new Date().getFullYear() - DIFFERENCE_DATE)) {
            error.status = STATUS_INVALID;
            error.fields.push('year');
        }

        return error;
    }

    function updateTable(data={}) {
        let rows = '';
        resetTable();

        for (let i=0; i<data.length; i++) {
            rows += getRow(data[i], i+1);
        }

        tableBody.append(rows);
    }

    function updatePagination(pageCount=1) {
        let pages = '';
        let paginationView = $('.pagination');

        resetPagination();

        if (pageCount !== totalPages) {
            totalPages = pageCount;
            paginationView.empty();

            for (let i=1; i<=totalPages; i++) {
                pages += getPaginationItem(i);
            }

            paginationView.append(previousPage);
            paginationView.append(pages);
            paginationView.append(nextPage);
        }

        for (let item of paginationView.find('.page-link')) {
            if (parseInt($(item).text()) === currentPage) {
                $(item).addClass('selected');
            }
        }

        if (currentPage === INIT_PAGE) {
            disableItem(previousPage);
        }

        if (currentPage === totalPages) {
            disableItem(nextPage);
        }
    }

    function getPeoplePromise() {
        return  $.ajax({
            url: PEOPLE_URL,
            type: 'GET',
            contentType: 'application/json',
            data: searchData,
            dataType: 'json'
        });
    }

    function getRow(rowData={}, n=1) {
        return '<tr>' +
            '<td scope="row" data-id="' + rowData.id + '">' + n + '</td>' +
            '<td>' + rowData.firstName + '</td>' +
            '<td>' + rowData.lastName + '</td>' +
            '<td>' + rowData.fatherName + '</td>' +
            '<td>' + rowData.birthDate + '</td>' +
            '<td>' + rowData.address.replace(/\s\s+/g, ' ') + '</td>' +
            '</tr>';
    }

    function getPaginationItem(n=1) {
        return  '<li class="page-item"><a class="page-link" href="#' + n + '">' + n  + '</a></li>';
    }

    function initInputs(inputs) {
        inputs.forEach((field) => {
            inputsSelectors[field] = $('input[name=' + field +']');
        });
    }

    function getInputsValues(inputs) {
        let data = {};
        inputs.forEach((field) => {
            data[field] = $('input[name=' + field +']').val().trim();
        });
        return data;
    }

    function disableItem(item) {
        item.addClass('disabled').css('pointer-events', 'none');
    }

    function enableItem(item) {
        item.removeClass('disabled').css('pointer-events', 'auto');
    }

    function resetTable() {
        tableBody.empty();
    }

    function resetPagination() {
        $('.pagination li > a').removeClass('selected');
        enableItem($('.pagination li'));
    }

    function showLoadMask() {
        searchContainer.addClass('loading-mask');
    }

    function hideLoadMask() {
        searchContainer.removeClass('loading-mask');
    }

    function showErrors(error={}) {
        error.fields.forEach((field) => {
            inputsSelectors[field].addClass('is-invalid');
        });
    }

    function cleanErrors() {
        searchInputs.removeClass('is-invalid');
    }
});