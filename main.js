$(function() {
    var totalPages = 1;
    var searchData = {};
    var initialPage = 1;
    var currentPage = 1;

    resetTable();

    $('#search').click(function(e) {
        e.preventDefault();

        currentPage = initialPage;
        searchData = collectData();

        var error = validate(searchData);
        cleanErrors();

        if (error.status === 'valid') {
            showLoadMask();

            $.ajax({
                url: 'http://128.199.141.23/people',
                type: 'GET',
                contentType: 'application/json',
                data: searchData,
                dataType: 'json'
            }).done(function(data) {
                updateTable(data);
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
        var data = collectData();
        var error = validate(data);
        cleanErrors();

        if (error.status === 'invalid') {
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
            url: 'http://128.199.141.23/people',
            type: 'GET',
            contentType: 'application/json',
            data: searchData,
            dataType: 'json'
        }).done(function(data) {
            updateTable(data);
            hideLoadMask();
        }).fail(function(error) {
            hideLoadMask();
            console.log(error);
        })
    });

    function collectData() {
        var data = {};

        data.firstName = $('input[name=firstName]').val().trim();
        data.lastName = $('input[name=lastName]').val().trim();
        data.fatherName = $('input[name=fatherName]').val().trim();
        data.year = $('input[name=year]').val().trim();
        data.page = initialPage;

        return data;
    }

    function validate(data) {
        //not Armenian letters pattern
        var pattern = /[^\u0561-\u0587\u0531-\u0556]+/g;
        var error = {
            status: 'valid',
            fields: []
        };

        if (data.firstName === '' || data.firstName.match(pattern)) {
            error.status = 'invalid';
            error.fields.push('firstName');
        }

        if (data.lastName === '' || data.lastName.match(pattern)) {
            error.status = 'invalid';
            error.fields.push('lastName');
        }

        if (data.fatherName.match(pattern)) {
            error.status = 'invalid';
            error.fields.push('fatherName');
        }

        if (data.year !== '' && !(data.year > 1900 && data.year < new Date().getFullYear() - 18)) {
            error.status = 'invalid';
            error.fields.push('year');
        }

        return error;
    }

    function showErrors(error) {
        error.fields.forEach(function(field) {
            $('input[name=' + field +']').addClass('is-invalid');
        });
    }

    function cleanErrors() {
        $('form input').removeClass('is-invalid');
    }

    function updateTable(data) {
        var rows = '';
        var tableBody = $('#table-data');
        resetTable();

        totalPages = data.totalPages;

        for (var i=0; i<data.people.length; i++) {
            rows += getRow(data.people[i], i+1);
        }

        tableBody.append(rows);

        updatePagination();
    }

    function getRow(rowData, n) {
        return '<tr>' +
            '<td scope="row" data-id="' + rowData.id + '">' + n + '</td>' +
            '<td>' + rowData.firstName + '</td>' +
            '<td>' + rowData.lastName + '</td>' +
            '<td>' + rowData.fatherName + '</td>' +
            '<td>' + rowData.birthDate + '</td>' +
            '<td>' + rowData.address.replace(/\s\s+/g, ' ') + '</td>' +
        '</tr>';
    }

    function updatePagination() {
        var pages = '';
        var paginationView = $('.pagination');
        var previousPage = $('.previous');
        var nextPage = $('.next');
        resetPagination();

        if (paginationView.find('li').length-2 !== totalPages) {
            paginationView.empty();

            if (totalPages === 0) {
                totalPages = 1;
            }

            for (var i=1; i<=totalPages; i++) {
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

        if (currentPage === 1) {
            previousPage.addClass('disabled').css('pointer-events', 'none');
        }

        if (currentPage === totalPages) {
            nextPage.addClass('disabled').css('pointer-events', 'none');
        }
    }

    function getPaginationItem(n) {
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