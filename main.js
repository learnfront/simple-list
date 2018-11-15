$(function() {
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

    resetTable();

    $('#search').click(function(e) {
        e.preventDefault();
        currentPage = INIT_PAGE;
        searchData = collectData();

        let error = validate(searchData);
        cleanErrors();

        if (error.status === STATUS_VALID) {
            showLoadMask();

            $.ajax({
                url: PEOPLE_URL,
                type: 'GET',
                contentType: 'application/json',
                data: searchData,
                dataType: 'json'
            }).done(function(data) {
                updateTable(data.people);
                updatePagination(data.totalPages);
                hideLoadMask();
            }).fail(function(error) {
                hideLoadMask();
                console.log(error);
            });

            $('#search').addClass('disabled').css('pointer-events', 'none');

        } else {
            showErrors(error);
            $('#search').addClass('disabled').css('pointer-events', 'none');
        }
    });

    $('form input.form-control').keydown(function() {
        let data = collectData();
        let error = validate(data);
        cleanErrors();

        if (error.status === STATUS_INVALID) {
            showErrors(error);
            $('#search').addClass('disabled').css('pointer-events', 'none');
        } else {
            $('#search').removeClass('disabled').css('pointer-events', 'auto');
        }
    });
    $('.pagination').on('click', '.page-item', function (e) {
        e.preventDefault();

        if ($(this).hasClass('next')) {
            currentPage++;
        } else if ($(this).hasClass('previous')) {
            currentPage--;
        } else {
            currentPage = parseInt($(this).text());
        }

        searchData.page = currentPage;

        $.ajax({
            url: PEOPLE_URL,
            type: 'GET',
            contentType: 'application/json',
            data: searchData,
            dataType: 'json'
        }).done(function(data) {
            updateTable(data.people);
            updatePagination(data.totalPages);
            hideLoadMask();
        }).fail(function(error) {
            hideLoadMask();
            console.log(error);
        })
    });

    function collectData() {
        let data = {};

        data.firstName = $('input[name=firstName]').val().trim();
        data.lastName = $('input[name=lastName]').val().trim();
        data.fatherName = $('input[name=fatherName]').val().trim();
        data.year = $('input[name=year]').val().trim();
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

    function showErrors(error={}) {
        error.fields.forEach(function(field) {
            $('input[name=' + field +']').addClass('is-invalid');
        });
    }

    function cleanErrors() {
        $('form input').removeClass('is-invalid');
    }

    function updateTable(data={}) {
        let rows = '';
        let tableBody = $('#table-data');
        resetTable();

        for (let i=0; i<data.length; i++) {
            rows += getRow(data[i], i+1);
        }

        tableBody.append(rows);
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

    function updatePagination(pageCount=1) {
        let pages = '';
        let paginationView = $('.pagination');
        let previousPage = $('.previous');
        let nextPage = $('.next');
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

        $.each(paginationView.find('.page-link'), function() {
            if (parseInt($(this).text()) === currentPage) {
                $(this).addClass('selected');
            }
        });

        if (currentPage === INIT_PAGE) {
            previousPage.addClass('disabled').css('pointer-events', 'none');
        }

        if (currentPage === totalPages) {
            nextPage.addClass('disabled').css('pointer-events', 'none');
        }
    }

    function getPaginationItem(n=1) {
        return  '<li class="page-item"><a class="page-link" href="#' + n + '">' + n  + '</a></li>';
    }

    function resetTable() {
        $('#table-data').empty();
    }

    function resetPagination() {
        $('.pagination li > a').removeClass('selected');
        $('.pagination li').removeClass('disabled').css('pointer-events', 'auto');
    }

    function showLoadMask() {
        $('.search-container').addClass('loading-mask');
    }

    function hideLoadMask() {
        $('.search-container').removeClass('loading-mask');
    }

});