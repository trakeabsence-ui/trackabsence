## Table `institutions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `slug` | `text` |  Unique |
| `timezone` | `text` |  |
| `checkin_opens_minutes_before` | `int4` |  |
| `checkin_closes_minutes_after` | `int4` |  |
| `late_after_minutes` | `int4` |  |
| `qr_token_ttl_seconds` | `int4` |  |
| `attendance_edit_hours` | `int4` |  |
| `risk_warning_pct` | `numeric` |  |
| `risk_critical_pct` | `numeric` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `departments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `name` | `text` |  |
| `code` | `text` |  |
| `created_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `terms`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `name` | `text` |  |
| `starts_on` | `date` |  |
| `ends_on` | `date` |  |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  |

## Table `holidays`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `name` | `text` |  |
| `holiday_date` | `date` |  |

## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `role` | `user_role` |  |
| `first_name` | `text` |  |
| `last_name` | `text` |  |
| `email` | `text` |  |
| `title` | `text` |  Nullable |
| `department_id` | `uuid` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `status` | `profile_status` |  |
| `last_active_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `teacher_private_details`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `teacher_id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `phone` | `text` |  Nullable |
| `office` | `text` |  Nullable |
| `employee_no` | `text` |  Nullable |
| `personal_email` | `text` |  Nullable |
| `bio` | `text` |  Nullable |
| `updated_at` | `timestamptz` |  |

## Table `teacher_private_notes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `owner_teacher_id` | `uuid` |  |
| `entity_type` | `text` |  |
| `entity_id` | `uuid` |  |
| `body` | `text` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `students`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `profile_id` | `uuid` |  Nullable Unique |
| `student_number` | `text` |  |
| `first_name` | `text` |  |
| `last_name` | `text` |  |
| `email` | `text` |  |
| `phone` | `text` |  Nullable |
| `program` | `text` |  |
| `year_level` | `int4` |  |
| `risk_level` | `risk_level` |  |
| `search_tsv` | `tsvector` |  Nullable |
| `deleted_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `modules`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `term_id` | `uuid` |  |
| `department_id` | `uuid` |  Nullable |
| `owner_teacher_id` | `uuid` |  |
| `code` | `text` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `color` | `text` |  |
| `is_archived` | `bool` |  |
| `deleted_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `classes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `term_id` | `uuid` |  |
| `teacher_id` | `uuid` |  |
| `department_id` | `uuid` |  Nullable |
| `code` | `text` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `room` | `text` |  Nullable |
| `color` | `text` |  |
| `expected_students` | `int4` |  |
| `is_archived` | `bool` |  |
| `deleted_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `class_modules`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `class_id` | `uuid` |  |
| `module_id` | `uuid` |  |
| `created_at` | `timestamptz` |  |

## Table `enrollments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `class_id` | `uuid` |  |
| `student_id` | `uuid` |  |
| `enrolled_at` | `timestamptz` |  |
| `status` | `text` |  |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `schedule_rules`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `class_id` | `uuid` |  |
| `class_module_id` | `uuid` |  |
| `weekday` | `int2` |  |
| `starts_at_time` | `time` |  |
| `ends_at_time` | `time` |  |
| `room` | `text` |  Nullable |
| `valid_from` | `date` |  |
| `valid_until` | `date` |  |
| `is_active` | `bool` |  |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `class_id` | `uuid` |  |
| `class_module_id` | `uuid` |  Nullable |
| `schedule_rule_id` | `uuid` |  Nullable |
| `teacher_id` | `uuid` |  |
| `starts_at` | `timestamptz` |  |
| `ends_at` | `timestamptz` |  |
| `room` | `text` |  Nullable |
| `status` | `session_status` |  |
| `qr_enabled` | `bool` |  |
| `opened_at` | `timestamptz` |  Nullable |
| `closed_at` | `timestamptz` |  Nullable |
| `cancel_reason` | `text` |  Nullable |
| `rescheduled_to` | `uuid` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `attendance`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `session_id` | `uuid` |  |
| `student_id` | `uuid` |  |
| `status` | `attendance_status` |  |
| `late_minutes` | `int4` |  Nullable |
| `notes` | `text` |  Nullable |
| `justification_reason` | `text` |  Nullable |
| `justification_url` | `text` |  Nullable |
| `source` | `attendance_source` |  |
| `marked_by` | `uuid` |  Nullable |
| `marked_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `attendance_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `institution_id` | `uuid` |  |
| `attendance_id` | `uuid` |  |
| `session_id` | `uuid` |  |
| `student_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `before_data` | `jsonb` |  Nullable |
| `after_data` | `jsonb` |  |
| `created_at` | `timestamptz` |  |

## Table `qr_tokens`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `session_id` | `uuid` |  |
| `token_hash` | `text` |  Unique |
| `nonce` | `text` |  |
| `issued_by` | `uuid` |  Nullable |
| `expires_at` | `timestamptz` |  |
| `created_at` | `timestamptz` |  |

## Table `qr_token_uses`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `token_id` | `uuid` |  |
| `student_id` | `uuid` |  |
| `used_at` | `timestamptz` |  |

## Table `session_changes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `session_id` | `uuid` |  |
| `change` | `change_type` |  |
| `reason` | `text` |  |
| `previous` | `jsonb` |  |
| `new_values` | `jsonb` |  |
| `changed_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `notifications`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `kind` | `notification_kind` |  |
| `title` | `text` |  |
| `body` | `text` |  Nullable |
| `link` | `text` |  Nullable |
| `read_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `audit_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `institution_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `entity_type` | `text` |  |
| `entity_id` | `uuid` |  Nullable |
| `before_data` | `jsonb` |  Nullable |
| `after_data` | `jsonb` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `report_exports`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `requested_by` | `uuid` |  Nullable |
| `report_type` | `text` |  |
| `filters` | `jsonb` |  |
| `file_path` | `text` |  Nullable |
| `row_count` | `int4` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `import_jobs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `class_id` | `uuid` |  Nullable |
| `created_by` | `uuid` |  |
| `kind` | `import_kind` |  |
| `status` | `import_status` |  |
| `file_path` | `text` |  Nullable |
| `file_name` | `text` |  Nullable |
| `model_version` | `text` |  Nullable |
| `total_rows` | `int4` |  |
| `valid_rows` | `int4` |  |
| `warning_rows` | `int4` |  |
| `error_rows` | `int4` |  |
| `error_report_path` | `text` |  Nullable |
| `summary` | `jsonb` |  |
| `created_at` | `timestamptz` |  |
| `completed_at` | `timestamptz` |  Nullable |

## Table `timetable_import_drafts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_id` | `uuid` |  |
| `import_job_id` | `uuid` |  |
| `class_id` | `uuid` |  Nullable |
| `raw_response` | `jsonb` |  Nullable |
| `extracted_rows` | `jsonb` |  |
| `corrections` | `jsonb` |  |
| `status` | `import_status` |  |
| `created_at` | `timestamptz` |  |
| `committed_at` | `timestamptz` |  Nullable |

## Custom Types / Enums

### `user_role`

`teacher` | `admin` | `student`

### `profile_status`

`invited` | `active` | `suspended`

### `attendance_status`

`present` | `late` | `absent` | `justified`

### `attendance_source`

`qr` | `teacher` | `auto` | `admin_correction` | `import`

### `session_status`

`scheduled` | `live` | `completed` | `cancelled` | `rescheduled`

### `change_type`

`cancelled` | `rescheduled` | `time_changed` | `room_changed`

### `risk_level`

`healthy` | `watch` | `at_risk` | `critical`

### `import_kind`

`students_csv` | `students_xlsx` | `timetable_image` | `timetable_text`

### `import_status`

`staged` | `review` | `committed` | `failed`

### `notification_kind`

`session` | `attendance` | `risk` | `import` | `report` | `invite` | `system`

## RLS Policies

### `institutions`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `institutions_select` | SELECT | authenticated | PERMISSIVE | `(id = current_institution_id())` | — |
| `institutions_update` | UPDATE | authenticated | PERMISSIVE | `((id = current_institution_id()) AND is_admin())` | `((id = current_institution_id()) AND is_admin())` |

### `departments`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `departments_admin_all` | ALL | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND is_admin())` | `((institution_id = current_institution_id()) AND is_admin())` |
| `departments_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (deleted_at IS NULL))` | — |

### `terms`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `terms_admin_all` | ALL | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND is_admin())` | `((institution_id = current_institution_id()) AND is_admin())` |
| `terms_select` | SELECT | authenticated | PERMISSIVE | `(institution_id = current_institution_id())` | — |

### `holidays`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `holidays_admin_all` | ALL | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND is_admin())` | `((institution_id = current_institution_id()) AND is_admin())` |
| `holidays_select` | SELECT | authenticated | PERMISSIVE | `(institution_id = current_institution_id())` | — |

### `profiles`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `profiles_admin_all` | ALL | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND is_admin())` | `((institution_id = current_institution_id()) AND is_admin())` |
| `profiles_select` | SELECT | authenticated | PERMISSIVE | `((deleted_at IS NULL) AND ((id = auth.uid()) OR ((institution_id = current_institution_id()) AND is_admin())))` | — |
| `profiles_update_self` | UPDATE | authenticated | PERMISSIVE | `((id = auth.uid()) AND (institution_id = current_institution_id()))` | `((id = auth.uid()) AND (institution_id = current_institution_id()))` |

### `teacher_private_details`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `teacher_private_details_insert` | INSERT | authenticated | PERMISSIVE | — | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (teacher_id = auth.uid()))))` |
| `teacher_private_details_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (teacher_id = auth.uid()))))` | — |
| `teacher_private_details_update` | UPDATE | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (teacher_id = auth.uid()))))` | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (teacher_id = auth.uid()))))` |

### `teacher_private_notes`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `teacher_private_notes_insert` | INSERT | authenticated | PERMISSIVE | — | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (owner_teacher_id = auth.uid()))))` |
| `teacher_private_notes_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (owner_teacher_id = auth.uid()))))` | — |
| `teacher_private_notes_update` | UPDATE | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (owner_teacher_id = auth.uid()))))` | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (owner_teacher_id = auth.uid()))))` |

### `students`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `students_insert` | INSERT | authenticated | PERMISSIVE | — | `((institution_id = current_institution_id()) AND (is_admin() OR is_teacher()))` |
| `students_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (deleted_at IS NULL) AND (is_admin() OR (profile_id = auth.uid()) OR teacher_owns_student(id)))` | — |
| `students_update` | UPDATE | authenticated | PERMISSIVE | `(is_admin() OR teacher_owns_student(id))` | `((institution_id = current_institution_id()) AND (is_admin() OR teacher_owns_student(id)))` |

### `modules`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `modules_insert` | INSERT | authenticated | PERMISSIVE | — | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (owner_teacher_id = auth.uid()))))` |
| `modules_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (deleted_at IS NULL) AND can_view_module(id))` | — |
| `modules_update` | UPDATE | authenticated | PERMISSIVE | `owns_module(id)` | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (owner_teacher_id = auth.uid()))))` |

### `classes`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `classes_insert` | INSERT | authenticated | PERMISSIVE | — | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (teacher_id = auth.uid()))))` |
| `classes_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (deleted_at IS NULL) AND can_view_class(id))` | — |
| `classes_update` | UPDATE | authenticated | PERMISSIVE | `can_manage_class(id)` | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (teacher_id = auth.uid()))))` |

### `class_modules`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `class_modules_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (can_view_class(class_id) OR owns_module(module_id)))` | — |
| `class_modules_write` | ALL | authenticated | PERMISSIVE | `(is_admin() OR can_manage_class(class_id))` | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND can_manage_class(class_id))))` |

### `enrollments`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `enrollments_delete` | DELETE | authenticated | PERMISSIVE | `(is_admin() OR can_manage_class(class_id))` | — |
| `enrollments_insert` | INSERT | authenticated | PERMISSIVE | — | `((institution_id = current_institution_id()) AND (is_admin() OR can_manage_class(class_id)))` |
| `enrollments_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR can_manage_class(class_id) OR (EXISTS ( SELECT 1    FROM students st   WHERE ((st.id = enrollments.student_id) AND (st.profile_id = auth.uid()))))))` | — |
| `enrollments_update` | UPDATE | authenticated | PERMISSIVE | `(is_admin() OR can_manage_class(class_id))` | `((institution_id = current_institution_id()) AND (is_admin() OR can_manage_class(class_id)))` |

### `schedule_rules`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `schedule_rules_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND can_view_class(class_id))` | — |
| `schedule_rules_write` | ALL | authenticated | PERMISSIVE | `can_manage_schedule_rule(class_id, class_module_id)` | `((institution_id = current_institution_id()) AND can_manage_schedule_rule(class_id, class_module_id))` |

### `sessions`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `sessions_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND can_view_session(id))` | — |
| `sessions_write` | ALL | authenticated | PERMISSIVE | `can_manage_session(id)` | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (teacher_id = auth.uid())) OR can_manage_class(class_id)))` |

### `attendance`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `attendance_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR (EXISTS ( SELECT 1    FROM sessions s   WHERE ((s.id = attendance.session_id) AND can_manage_session(s.id)))) OR (EXISTS ( SELECT 1    FROM students st   WHERE ((st.id = attendance.student_id) AND (st.profile_id = auth.uid()))))))` | — |

### `attendance_history`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `attendance_history_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR (EXISTS ( SELECT 1    FROM sessions s   WHERE ((s.id = attendance_history.session_id) AND can_manage_session(s.id)))) OR (EXISTS ( SELECT 1    FROM students st   WHERE ((st.id = attendance_history.student_id) AND (st.profile_id = auth.uid()))))))` | — |

### `session_changes`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `session_changes_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND can_view_session(session_id))` | — |

### `notifications`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `notifications_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (user_id = auth.uid()))` | — |
| `notifications_update` | UPDATE | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (user_id = auth.uid()))` | `((institution_id = current_institution_id()) AND (user_id = auth.uid()))` |

### `audit_logs`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `audit_logs_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND is_admin())` | — |

### `report_exports`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `report_exports_insert` | INSERT | authenticated | PERMISSIVE | — | `((institution_id = current_institution_id()) AND (is_admin() OR (requested_by = auth.uid())))` |
| `report_exports_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR (requested_by = auth.uid())))` | — |

### `import_jobs`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `import_jobs_insert` | INSERT | authenticated | PERMISSIVE | — | `((institution_id = current_institution_id()) AND (is_admin() OR (is_teacher() AND (created_by = auth.uid()))))` |
| `import_jobs_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR (created_by = auth.uid())))` | — |
| `import_jobs_update` | UPDATE | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR (created_by = auth.uid())))` | `((institution_id = current_institution_id()) AND (is_admin() OR (created_by = auth.uid())))` |

### `timetable_import_drafts`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `timetable_import_drafts_insert` | INSERT | authenticated | PERMISSIVE | — | `((institution_id = current_institution_id()) AND (EXISTS ( SELECT 1    FROM import_jobs j   WHERE ((j.id = timetable_import_drafts.import_job_id) AND ((j.created_by = auth.uid()) OR is_admin())))))` |
| `timetable_import_drafts_select` | SELECT | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR (EXISTS ( SELECT 1    FROM import_jobs j   WHERE ((j.id = timetable_import_drafts.import_job_id) AND (j.created_by = auth.uid()))))))` | — |
| `timetable_import_drafts_update` | UPDATE | authenticated | PERMISSIVE | `((institution_id = current_institution_id()) AND (is_admin() OR (EXISTS ( SELECT 1    FROM import_jobs j   WHERE ((j.id = timetable_import_drafts.import_job_id) AND (j.created_by = auth.uid()))))))` | `((institution_id = current_institution_id()) AND (is_admin() OR (EXISTS ( SELECT 1    FROM import_jobs j   WHERE ((j.id = timetable_import_drafts.import_job_id) AND (j.created_by = auth.uid()))))))` |