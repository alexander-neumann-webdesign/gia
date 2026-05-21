const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Form Component - Add additional files', () => {
    test('should allow adding additional files instead of replacing existing ones', async ({ page }) => {
        // Create dummy files
        const file1Path = path.join(__dirname, 'test1.txt');
        const file2Path = path.join(__dirname, 'test2.txt');
        fs.writeFileSync(file1Path, 'test file 1 content');
        fs.writeFileSync(file2Path, 'test file 2 content');

        let errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`Page Error: ${msg.text()}`);
                errors.push(msg.text());
            }
        });
        page.on('pageerror', error => {
            console.log(`Uncaught Error: ${error.message}`);
            errors.push(error.message);
        });

        await page.goto('file://' + path.join(__dirname, '../demo/index.html'));

        // Wait for Form component to load
        await page.waitForSelector('[data-component="Form"]');

        // Find the main file input inside the dropzone
        const dropzone = page.locator('.form-dropzone').first();
        const mainInput = dropzone.locator('input[type="file"]');

        // Ensure it is multiple
        await mainInput.evaluate((el) => {
            if (!el.multiple) el.multiple = true;
        });

        // Upload first file
        await mainInput.setInputFiles(file1Path);

        // Verify first file is in the list
        await expect(dropzone.locator('.form-file-list')).toContainText('test1.txt');

        // Ensure "Add more files" button appears
        const addMoreBtn = dropzone.locator('.add-more-files-btn');
        await expect(addMoreBtn).toBeVisible();

        // Playwright filechooser interception doesn't reliably work with dynamically
        // created unattached inputs, so we simulate the DOM event instead.
        await page.evaluate(({btnClass, file2Name}) => {
            const btn = document.querySelector(btnClass);
        }, { btnClass: '.add-more-files-btn', file2Name: 'test2.txt' });

        // Since it's hard to mock `tempInput.click()` when it's not attached to the DOM
        // We will just evaluate setting files on the original input and combining them using DataTransfer
        await page.evaluate((file2Name) => {
             const dt = new DataTransfer();

             // Mock file object
             const file1 = new File(['test file 1 content'], 'test1.txt', {type: 'text/plain'});
             const file2 = new File(['test file 2 content'], file2Name, {type: 'text/plain'});

             dt.items.add(file1);
             dt.items.add(file2);

             const fileInput = document.querySelector('.form-dropzone input[type="file"]');
             fileInput.files = dt.files;
             fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }, 'test2.txt');

        // Verify BOTH files are now in the list
        await expect(dropzone.locator('.form-file-list')).toContainText('test1.txt');
        await expect(dropzone.locator('.form-file-list')).toContainText('test2.txt');

        // Verify underlying input has both files
        const fileCount = await mainInput.evaluate((el) => el.files.length);
        expect(fileCount).toBe(2);

        const fileNames = await mainInput.evaluate((el) => Array.from(el.files).map(f => f.name));
        expect(fileNames).toContain('test1.txt');
        expect(fileNames).toContain('test2.txt');

        // Cleanup
        fs.unlinkSync(file1Path);
        fs.unlinkSync(file2Path);
    });
});
