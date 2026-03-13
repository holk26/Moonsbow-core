class EventType(str):
    # Auth events
    USER_REGISTERED = "user.registered"
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    USER_PASSWORD_CHANGED = "user.password_changed"

    # Tenant events
    TENANT_CREATED = "tenant.created"
    TENANT_UPDATED = "tenant.updated"
    TENANT_DELETED = "tenant.deleted"

    # Billing events
    SUBSCRIPTION_CREATED = "subscription.created"
    SUBSCRIPTION_UPDATED = "subscription.updated"
    SUBSCRIPTION_CANCELLED = "subscription.cancelled"

    # Notification events
    NOTIFICATION_SENT = "notification.sent"

    # LMS events
    COURSE_CREATED = "lms.course.created"
    COURSE_ENROLLED = "lms.course.enrolled"

    # Restaurant events
    ORDER_PLACED = "restaurant.order.placed"
    ORDER_COMPLETED = "restaurant.order.completed"

    # Finance events
    TRANSACTION_CREATED = "finance.transaction.created"
